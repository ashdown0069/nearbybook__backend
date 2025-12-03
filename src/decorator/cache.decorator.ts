import { Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

interface CacheableOptions {
  ttl?: number; // 캐시 유지 시간 (밀리초)
  customKey: (args: any[]) => string; // [필수] 키 생성 로직
}

export function Cacheable(options: CacheableOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    // console.log('descriptor', target, propertyKey, descriptor);
    // console.log('options', options);
    // 로거 생성 (로그에 'UserService' 처럼 클래스 이름이 찍히도록 설정)
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      // 1. CacheManager 주입 확인
      const cacheManager: Cache = (this as any).cacheManager;
      if (!cacheManager) {
        logger.warn(
          `[Cacheable] ⚠️ CacheManager가 주입되지 않아 캐싱을 건너뜁니다.`,
        );
        return originalMethod.apply(this, args);
      }

      // 2. 키 생성 (안전장치 추가)
      let cacheKey = '';
      try {
        cacheKey = options.customKey(args);
      } catch (error) {
        logger.error(
          `[Cacheable] ⚠️ 키 생성 중 에러 발생. 원본 메서드를 실행합니다. Error: ${error}`,
        );
        return originalMethod.apply(this, args);
      }

      const cacheStart = performance.now();
      // [STEP 1] 캐시 조회 로그
      logger.debug(`[Cacheable] 🔎 조회 시도 Key: "${cacheKey}"`);

      try {
        // 3. 캐시 조회
        const cachedValue = await cacheManager.get(cacheKey);

        // [STEP 2-A] HIT (캐시 있음)
        if (cachedValue !== undefined && cachedValue !== null) {
          const cacheEnd = performance.now();
          logger.log(
            `[Cacheable] ✅ HIT! Key: "${cacheKey}" (캐시된 값 반환) (실행시간 ${(cacheEnd - cacheStart).toFixed(2)}ms})`,
          );
          return cachedValue;
        }

        // [STEP 2-B] MISS (캐시 없음)
        logger.debug(
          `[Cacheable] ❌ MISS. Key: "${cacheKey}" (원본 메서드 실행)`,
        );
      } catch (error) {
        logger.error(
          `[Cacheable] Redis/Cache 에러 무시하고 로직 진행: ${error}`,
        );
      }

      // 4. 원본 메서드 실행 (DB 조회 등)
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const end = performance.now();

      // 5. 캐시 저장
      if (result !== undefined) {
        try {
          await cacheManager.set(cacheKey, result, options.ttl);
          logger.log(
            `[Cacheable] 💾 SAVE 완료. Key: "${cacheKey}" (실행시간: ${(end - start).toFixed(2)}ms)`,
          );
        } catch (error) {
          logger.error(`[Cacheable] ⚠️ 저장 실패: ${error}`);
        }
      } else {
        logger.warn(
          `[Cacheable] ⚠️ 결과가 undefined여서 저장하지 않음. Key: "${cacheKey}"`,
        );
      }

      return result;
    };

    return descriptor;
  };
}
