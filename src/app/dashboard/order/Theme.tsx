import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    incart: Palette["primary"];
    unpaid: Palette["primary"];
    paid: Palette["primary"];
    preparing: Palette["primary"];
    shipped: Palette["primary"];
    arrived: Palette["primary"];
  }

  interface PaletteOptions {
    incart: PaletteOptions["primary"];
    unpaid: PaletteOptions["primary"];
    paid: PaletteOptions["primary"];
    preparing: PaletteOptions["primary"];
    shipped: PaletteOptions["primary"];
    arrived: PaletteOptions["primary"];
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    incart: true;
    unpaid: true;
    paid: true;
    preparing: true;
    shipped: true;
    arrived: true;
  }
}

export const Mutiselectstatuscolor = createTheme({
  palette: {
    incart: {
      main: "#495464",
      light: "#495464",
      dark: "#495464",
      contrastText: "#ffffff",
    },
    unpaid: {
      main: "#EB5757",
      contrastText: "#ffffff",
    },
    paid: {
      main: "#35C191",
      contrastText: "#ffffff",
    },
    preparing: {
      main: "#0097FA",
      contrastText: "#ffffff",
    },
    shipped: {
      main: "#60513C",
      contrastText: "#ffffff",
    },
    arrived: {
      main: "#35C191",
      contrastText: "#ffffff",
    },
  },
});
