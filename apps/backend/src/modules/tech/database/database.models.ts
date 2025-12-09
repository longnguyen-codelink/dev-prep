import type { ModelCtor } from "sequelize-typescript";

import { Breed } from "@/modules/domain/breed/entity/breed.entity";

export const models: ModelCtor[] = [Breed];
