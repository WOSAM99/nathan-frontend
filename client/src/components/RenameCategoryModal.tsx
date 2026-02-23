import { CategoryFormValues, RenameCategoryModalProps } from "@/types";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

export default function RenameCategoryModal({
  open,
  initialValue,
  loading = false,
  onConfirm,
  onCancel,
}: RenameCategoryModalProps) {
  const formValidation = useMemo(
    () =>
      Yup.object().shape({
        categoryName: Yup.string()
          .trim()
          .required("Category name is required")
          .min(2, "Minimum 2 characters required")
          .max(40, "Maximum 40 characters allowed"),
      }),
    [],
  );

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

  useEffect(() => {
    if (open) {
      reset({ categoryName: initialValue || "" });
    }
  }, [initialValue, open, reset]);

  const submitHandler = (data: CategoryFormValues) => {
    onConfirm(data.categoryName.trim());
  };

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
      <form onSubmit={handleSubmit(submitHandler)}>
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
            {...register("categoryName")}
            error={!!errors.categoryName}
            helperText={errors.categoryName?.message}
          />
        </DialogContent>

        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || loading}
            sx={{
              bgcolor: "#000",
              color: "#fff",
              boxShadow: "0px 6px 16px rgba(0,0,0,0.15)",
            }}
            startIcon={
              loading ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : null
            }
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
      </form>
    </Dialog>
  );
}
