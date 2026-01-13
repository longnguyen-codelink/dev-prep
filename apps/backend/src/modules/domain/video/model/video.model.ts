import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({ tableName: "video", schema: "public", timestamps: false })
export class Video extends Model {
	@Column({ primaryKey: true, type: DataType.UUID })
	declare id: string;

	@Column
	declare title: string;

	@Column
	declare description: string;

	@Column
	declare url: string;

	@Column({ type: DataType.DATE })
	declare created_at: Date;
}
