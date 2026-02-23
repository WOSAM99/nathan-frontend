import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { CategoryFormValues, AddCategoryModalProps } from "@/types";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import CircularProgress from "@mui/material/CircularProgress";

const MAX_FILES = 5;

export default function AddCategoryModal({
  open,
  onClose,
  propertyId,
  userId,
  onSuccess,
}: AddCategoryModalProps) {
  const { showSnackbar } = useAppSnackbar();

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formValidation = useMemo(() => {
    return Yup.object().shape({
      categoryName: Yup.string()
        .trim()
        .required("Category name is required")
        .min(2, "Minimum 2 characters required")
        .max(40, "Maximum 40 characters allowed"),
    });
  }, []);

  const methods = useForm<CategoryFormValues>({
    mode: "onChange",
    resolver: yupResolver(formValidation),
    defaultValues: { categoryName: "" },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = methods;

  const handleClose = () => {
    if (isSubmitting) return;
    setFiles([]);
    reset();
    onClose();
  };

  // HANDLE FILE ADD
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];

    if (!selected.length) return;

    const total = [...files, ...selected];

    if (total.length > MAX_FILES) {
      showSnackbar(`Max ${MAX_FILES} images allowed`, "error");
      return;
    }

    setFiles(total);
  };

  // REMOVE FILE
  const handleRemove = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("property_id", propertyId);
      formData.append("category", data.categoryName.trim());

      if (userId) formData.append("user_id", userId);

      files.forEach((file) => {
        formData.append("images", file);
      });

      await api.addCategory(formData);

      showSnackbar("Category added successfully", "success");

      setFiles([]);
      reset();
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
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        },
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 20 }}>
        Add Category
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, px: 0 }}
        >
          {/* CATEGORY NAME */}
          <TextField
            label="Category Name*"
            fullWidth
            size="small"
            {...register("categoryName")}
            error={!!errors.categoryName}
            helperText={errors.categoryName?.message}
          />

          {/* FILE LIST */}
          {files.map((file, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                py: 0.5,
                px: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "6px",
              }}
            >
              <Typography fontSize={13}>{file.name}</Typography>

              <IconButton size="small" onClick={() => handleRemove(index)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}

          {/* ADD FILE BUTTON */}
          {files.length < MAX_FILES && (
            <Button variant="outlined" component="label" color="inherit">
              UPLOAD IMAGE
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </Button>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : null
            }
            sx={{
              bgcolor: "#000",
              color: "#fff",
              boxShadow: "0px 6px 16px rgba(0,0,0,0.15)",
            }}
          >
            Add
          </Button>

          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
