import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionService, authService } from "@/lib/api";
import type { CreateSubmissionDto } from "@/lib/api";

// ==================== SUBMISSIONS ====================

export function useSubmissions() {
  return useQuery({
    queryKey: ["submissions", "mine"],
    queryFn: () => submissionService.findMine(),
    retry: false,
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionService.getById(id),
    enabled: !!id,
    select: (data) => {
      // Flatten labResult from batchItems for easier access
      const firstBatchItem = data.batchItems?.[0] as any;
      return {
        ...data,
        labResult: firstBatchItem?.batch?.labResult || null,
        batchId: firstBatchItem?.batchId || null,
      };
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubmissionDto) => submissionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

// ==================== AUTH ====================

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.getMe(),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; password: string }) => 
      authService.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: any) => authService.register(data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
