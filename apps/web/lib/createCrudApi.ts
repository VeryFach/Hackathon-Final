import { api } from "@/lib/axios";

export const createCrudApi = <T, DTO = unknown>(endpoint: string) => {
  return {
    getAll: async (): Promise<T[]> => {
      const response = await api.get(endpoint);

      return response.data.data;
    },

    getById: async (id: number | string): Promise<T> => {
      const response = await api.get(`${endpoint}/${id}`);

      return response.data.data;
    },

    create: async (data: DTO): Promise<T> => {
      const response = await api.post(endpoint, data, {
        headers:
          data instanceof FormData
            ? {
                "Content-Type": "multipart/form-data",
              }
            : undefined,
      });

      return response.data.data;
    },

    update: async (id: number | string, data: DTO): Promise<T> => {
      let payload = data;

      if (data instanceof FormData) {
        const cloned = new FormData();

        data.forEach((value, key) => {
          cloned.append(key, value);
        });

        payload = cloned as DTO;
      }

      const response = await api.put(`${endpoint}/${id}`, payload, {
        headers:
          payload instanceof FormData
            ? {
                "Content-Type": "multipart/form-data",
              }
            : undefined,
      });

      return response.data.data;
    },

    delete: async (id: number | string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
};
