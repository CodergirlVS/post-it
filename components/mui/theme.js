import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#EF9D06',
    },
    secondary: {
      main: '#DC143C',
    },
    action: {
      main: '#D50005',
    },

    error: {
      main: red.A400,
    },
  },
});

export default theme;