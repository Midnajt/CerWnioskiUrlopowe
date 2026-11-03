import "styled-components";
import { lightTheme } from "@/lib/styles/theme";

type AppTheme = typeof lightTheme;

declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}
