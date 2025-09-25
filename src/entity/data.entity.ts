import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class libraryByISBN {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true })
  isbn: number;

  @Column({ type: 'integer' })
  region: number;

  @Column({ type: 'integer' })
  dtl_region: number;

  @Column()
  libCode: string;

  @Column()
  libName: string;

  @Column()
  address: string;

  @Column()
  tel: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  homepage: string;

  @Column()
  close: string;

  @Column()
  operatingTime: string;
}
