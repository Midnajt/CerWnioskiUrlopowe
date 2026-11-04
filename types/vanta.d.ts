declare module "vanta/dist/vanta.fog.min" {
  type FogEffect = { destroy: () => void };
  export default function FOG(options: Record<string, unknown>): FogEffect;
}
