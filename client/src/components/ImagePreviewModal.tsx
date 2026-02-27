import { Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ImagePreviewModal({
  open,
  imageUrl,
  onClose,
}: {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          background: "transparent",
          boxShadow: "none",
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0,0,0,0.2)",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* FIXED FRAME */}
        <Box
          sx={{
            position: "relative",
            width: "54vw",
            height: "70vh",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0px 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          {/* CLOSE */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "#fff",
              zIndex: 2,
              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* IMAGE */}
          <Box
            component="img"
            src={imageUrl || ""}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      </Box>
    </Dialog>
  );
}
