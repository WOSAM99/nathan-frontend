import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface RenameCategoryDialogProps {
  open: boolean;
  initialValue: string;
  loading?: boolean;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameCategoryDialog({
  open,
  initialValue,
  loading = false,
  onConfirm,
  onCancel,
}: RenameCategoryDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [initialValue, open]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "8px",
          padding: "18px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          justifyContent: "space-between",
        },
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 20 }}>
        Rename Category
      </Typography>

      <DialogContent
        sx={{
          px: "5px",
          overflowY: "unset",
        }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Category name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={() => onConfirm(value.trim())}
          disabled={!value.trim() || loading}
        >
          OK
        </Button>

        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          color={"inherit"}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
