import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  loading = false,
}: ConfirmDialogProps) {
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
        <Button onClick={onCancel} variant="outlined" disabled={loading} color={"inherit"}>
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
