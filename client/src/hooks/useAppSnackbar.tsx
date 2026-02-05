import { useSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const useAppSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showSnackbar = (
    message: string,
    variant: "success" | "error" | "warning" | "info"
  ) => {
    enqueueSnackbar(message, {
      variant,
      action: (snackbarId) => (
        <IconButton
          size="small"
          onClick={() => closeSnackbar(snackbarId)}
          sx={{ color: "white" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ),
    });
  };

  return { showSnackbar };
};
