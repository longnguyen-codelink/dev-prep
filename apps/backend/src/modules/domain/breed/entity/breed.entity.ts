import { Column, DataType, Model, Table } from "sequelize-typescript";

interface Measurement {
	imperial: string;
	metric: string;
}

export interface BreedAttributes {
	id: number;
	name: string;
	bred_for: string;
	breed_group: string;
	life_span: string;
	temperament: string;
	origin: string;
	reference_image_id: string;
	weight: Measurement;
	height: Measurement;
}

@Table({ tableName: "breed", schema: "system", timestamps: false })
export class Breed extends Model<BreedAttributes> implements BreedAttributes {
	@Column({ primaryKey: true, autoIncrement: true })
	declare id: number;

	@Column
	declare name: string;

	@Column
	declare bred_for: string;

	@Column
	declare breed_group: string;

	@Column
	declare life_span: string;

	@Column
	declare temperament: string;

	@Column
	declare origin: string;

	@Column
	declare reference_image_id: string;

	@Column({ type: DataType.JSON })
	declare weight: Measurement;

	@Column({ type: DataType.JSON })
	declare height: Measurement;
}
