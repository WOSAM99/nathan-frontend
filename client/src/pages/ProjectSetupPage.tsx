import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import AppNavbar from "@/components/AppNavBar";

export default function ProjectSetupPage() {
  const { showSnackbar } = useAppSnackbar();

  const [, setLocation] = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mlsFiles, setMlsFiles] = useState<File[]>([]);
  const [compFiles, setCompFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");

  const mlsInputRef = useRef<HTMLInputElement>(null);
  const compInputRef = useRef<HTMLInputElement>(null);

  const handleMlsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setMlsFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleCompUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setCompFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeMlsFile = (index: number) =>
    setMlsFiles((prev) => prev.filter((_, i) => i !== index));

  const removeCompFile = (index: number) =>
    setCompFiles((prev) => prev.filter((_, i) => i !== index));

  const uploadSequence = async () => {
    let currentPropId = "new";

    if (mlsFiles.length > 0) {
      const res = await api.uploadPDF(mlsFiles, currentPropId, "mls");
      currentPropId = res.property_id;
    }

    if (compFiles.length > 0) {
      const res = await api.uploadPDF(compFiles, currentPropId, "comps");
      currentPropId = res.property_id;
    }

    return currentPropId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mlsFiles.length === 0) {
    showSnackbar("Please upload MLS Listing PDF", "error");
    return;
  }

    setIsSubmitting(true);

    try {
      const finalPropertyId = await uploadSequence();

      showSnackbar("Project initialized successfully", "success");
      setLocation(`/organize/${finalPropertyId}`);
    } catch (error: any) {
      showSnackbar(error?.message || "Upload failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <AppNavbar showBack={true} />

      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 800,
          mx: "auto",
          px: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {/* TITLE */}
        <Box textAlign="center">
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 28 },
              fontWeight: 400,
              letterSpacing: 1,
            }}
          >
            Project Setup
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: "#888", mt: 1, letterSpacing: 1 }}
          >
            Upload documentation and context to begin transformation.
          </Typography>
        </Box>

        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: 600 }}
          id="project-setup-form"
        >
          {/* MLS UPLOAD */}
          <Box mb={4} mt={3}>
            <Typography
              sx={{
                fontSize: 12,
                letterSpacing: 1,
                color: "#888",
                textAlign: "center",
                mb: 1,
              }}
            >
              MLS URL / LISTING PDF
            </Typography>

            <input
              type="file"
              ref={mlsInputRef}
              hidden
              multiple
              accept=".pdf"
              onChange={handleMlsUpload}
            />

            {mlsFiles.length === 0 ? (
              <Box
                onClick={() => mlsInputRef.current?.click()}
                sx={{
                  border: "1px dashed #ddd",
                  borderRadius: 3,
                  height: 150,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#F3F5F7",
                  cursor: "pointer",
                }}
              >
                <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#888" }} />
                <Typography sx={{ fontSize: 12, mt: 1, letterSpacing: 1 }}>
                  SELECT OR DROP FILE
                </Typography>
              </Box>
            ) : (
              <Box>
                {mlsFiles.map((file, i) => (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1.5}
                    mb={1}
                    border="1px solid #eee"
                    borderRadius={2}
                    bgcolor="#fff"
                  >
                    <Typography noWrap sx={{ fontSize: 12, letterSpacing: 1 }}>
                      {file.name}
                    </Typography>

                    <IconButton onClick={() => removeMlsFile(i)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => mlsInputRef.current?.click()}
                >
                  Add another file
                </Button>
              </Box>
            )}
          </Box>

          {/* COMP UPLOAD */}
          <Box mb={4}>
            <Typography
              sx={{
                fontSize: 12,
                letterSpacing: 1,
                color: "#888",
                textAlign: "center",
                mb: 1,
              }}
            >
              COMP PDFS / REFERENCES
            </Typography>

            <input
              type="file"
              ref={compInputRef}
              hidden
              multiple
              accept=".pdf"
              onChange={handleCompUpload}
            />

            {compFiles.length === 0 ? (
              <Box
                onClick={() => compInputRef.current?.click()}
                sx={{
                  border: "1px dashed #ddd",
                  borderRadius: 3,
                  height: 150,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#F3F5F7",
                  cursor: "pointer",
                }}
              >
                <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#888" }} />
                <Typography sx={{ fontSize: 12, mt: 1, letterSpacing: 1 }}>
                  ADD REFERENCE MATERIAL
                </Typography>
              </Box>
            ) : (
              <Box>
                {compFiles?.map((file, i) => (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1.5}
                    mb={1}
                    border="1px solid #eee"
                    borderRadius={2}
                    bgcolor="#fff"
                  >
                    <Typography noWrap sx={{ fontSize: 12, letterSpacing: 1 }}>
                      {file.name}
                    </Typography>

                    <IconButton onClick={() => removeCompFile(i)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => compInputRef.current?.click()}
                >
                  Add another file
                </Button>
              </Box>
            )}
          </Box>
        </form>

        <Box mb={2} width="100%" maxWidth={900}></Box>

        {/* IMPORT BUTTON */}
        <Box textAlign="center">
          <Button
            type="submit"
            form="project-setup-form"
            disabled={
              isSubmitting || (mlsFiles.length === 0 && compFiles.length === 0)
            }
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : null
            }
            sx={{
              bgcolor: "#0b1320",
              color: "#fff",
              borderRadius: 20,
              px: 5,
              py: 1.2,
              letterSpacing: 1,
              "&:hover": { bgcolor: "#0b1320" },
              "&.Mui-disabled": {
                backgroundColor: "#0b1320",
                color: "#ffffff",
                opacity: 0.7,
              },
            }}
          >
            {isSubmitting ? "Processing..." : "IMPORT PHOTOS"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
