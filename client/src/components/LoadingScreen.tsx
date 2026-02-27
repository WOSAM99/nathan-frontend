import { Backdrop, CircularProgress, Box } from "@mui/material";

export default function LoadingScreen() {
  return (
    <Backdrop
      open
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backgroundColor: "#F8F9FA",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    </Backdrop>
  );
}
