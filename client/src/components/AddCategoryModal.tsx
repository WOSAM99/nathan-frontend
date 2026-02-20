import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function AddCategoryModal({
  open,
  onClose,
  propertyId,
  userId,
  onSuccess,
}: AddCategoryModalProps) {
  const { showSnackbar } = useAppSnackbar();

  const [categoryName, setCategoryName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setCategoryName("");
    setImageFile(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      showSnackbar("Category name is required", "warning");
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl: string | undefined;

      if (imageFile) {
        // const uploadRes = await api.getImageUrlMultipart(
        //   propertyId,
        //   userId,
        //   imageFile,
        // );
        // imageUrl = uploadRes?.url;
      }

      await api.addCategoryJson({
        property_id: propertyId,
        user_id: userId,
        category: categoryName.trim(),
        image: imageUrl,
      });

      showSnackbar("Category added successfully", "success");

      setCategoryName("");
      setImageFile(null);
      onClose();

      onSuccess?.();
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to add category", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        Add Category
      </Typography>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, px: "5px" }}
      >
        {/* CATEGORY NAME */}
        <TextField
          label="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
          fullWidth
          size="small"
        />

        {/* IMAGE UPLOAD */}
        <Button variant="outlined" component="label">
          {imageFile ? imageFile.name : "Upload Image (Optional)"}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </Button>

        {imageFile && (
          <Typography fontSize={12} color="text.secondary">
            {imageFile.name}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!categoryName.trim() || isSubmitting}
          color="inherit"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </Button>

        <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>

      </DialogActions>
    </Dialog>
  );
}
