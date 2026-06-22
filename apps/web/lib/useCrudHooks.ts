import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface CrudApi<T, DTO> {
  getAll: () => Promise<T[]>;
  getById: (id: number | string) => Promise<T>;
  create: (data: DTO) => Promise<T>;
  update: (id: number | string, data: DTO) => Promise<T>;
  delete: (id: number | string) => Promise<void>;
}

const makeCreateMutationFn = <T, DTO>(apiService: CrudApi<T, DTO>) => {
  return (data: DTO) => apiService.create(data);
};

const makeUpdateMutationFn = <T, DTO>(apiService: CrudApi<T, DTO>) => {
  return async ({ id, data }: { id: number | string; data: DTO }) => {
    if (data instanceof FormData && !data.has("_method")) {
      data.append("_method", "PUT");
    }

    return apiService.update(id, data);
  };
};

const makeDeleteMutationFn = <T, DTO>(apiService: CrudApi<T, DTO>) => {
  return (id: number | string) => apiService.delete(id);
};

export const createCrudHooks = <T, DTO = FormData>(
  queryKey: string[],
  apiService: CrudApi<T, DTO>,
) => {
  const getAll = () => apiService.getAll();
  const getById = (id: number | string) => apiService.getById(id);
  const createMutationFn = makeCreateMutationFn(apiService);
  const updateMutationFn = makeUpdateMutationFn(apiService);
  const deleteMutationFn = makeDeleteMutationFn(apiService);

  const useGet = () =>
    useQuery({
      queryKey,
      queryFn: getAll,
    });

  const useGetById = (id: number | string, enabled = true) =>
    useQuery({
      queryKey: [...queryKey, id],
      queryFn: () => getById(id),
      enabled,
    });

  const useCreate = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createMutationFn,
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey,
        });
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: updateMutationFn,

      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey,
        });

        await queryClient.invalidateQueries({
          queryKey: [...queryKey, variables.id],
        });
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deleteMutationFn,

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey,
        });
      },
    });
  };

  return {
    useGet,
    useGetById,
    useCreate,
    useUpdate,
    useDelete,
  };
};
