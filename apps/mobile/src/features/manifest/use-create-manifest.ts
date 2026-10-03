import { manifestResponseSchema, type ManifestRequest } from '@eloria/shared';
import { useMutation } from '@tanstack/react-query';
import { authedApi } from '@/lib/authed-api';

/** 꿈 등록 + 첫 스토리 생성 요청(POST /v1/manifests). 응답은 바로 오고 생성은 서버에서 이어진다. */
export function useCreateManifest() {
  return useMutation({
    mutationFn: (input: ManifestRequest) =>
      authedApi('/v1/manifests', { method: 'POST', body: input, schema: manifestResponseSchema }),
  });
}
