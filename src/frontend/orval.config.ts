import { defineConfig } from "orval";

export default defineConfig({
  financeTracker: {
    input: {
      target: "http://localhost:8080/swagger/v1/swagger.json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./src/api/instance/index.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
