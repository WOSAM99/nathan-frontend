import { Box, Card, CardContent, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F9FAFB",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ pt: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 32,
                color: "error.main",
              }}
            />

            <Typography variant="h5" fontWeight={700} color="text.primary">
              404 Page Not Found
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Did you forget to add the page to the router?
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
