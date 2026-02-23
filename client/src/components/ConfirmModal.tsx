import { ConfirmModalProps } from "@/types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>

      <DialogContent>
        <Typography fontSize={14} color="text.secondary">
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {confirmText}
        </Button>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
          color={"inherit"}
        >
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
