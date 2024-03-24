import { z } from '../../deps.ts';

const ClusterStructSchema = z.object({
    instances: z.number(),
    startPort: z.number()
});

const AppStructSchema = z.object({
    script: z.string(),
    id: z.string().trim(),
    cwd: z.optional(z.string()),
    timeout: z.optional(z.number()),
    autoStart: z.optional(z.boolean()),
    env: z.optional(z.record(z.string())),
    cluster: z.optional(ClusterStructSchema),
    permissions: z.optional(z.array(z.string())),
    restartDelaySec: z.optional(z.number().min(1))
});

export const DXPMConfigSchema = z.object({
    apps: z.array(AppStructSchema)
});

export type DXPMConfig = z.infer<typeof DXPMConfigSchema>;
