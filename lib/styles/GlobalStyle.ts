"use client";

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: ${({ theme }) => theme.surface.page};
    color: ${({ theme }) => theme.surface.text};
    font-family: ${({ theme }) => theme.fonts.body};
    line-height: 1.45;
    color-scheme: ${({ theme }) => theme.mode};
  }
  a { color: inherit; }
  button, input, select, textarea { font: inherit; }
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;
