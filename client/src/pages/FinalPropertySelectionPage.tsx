import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useAuth } from "@/contexts/AuthContext";
import { useRoute } from "wouter";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { api } from "@/lib/api";

export default function FinalPropertySelection() {
  const { userId } = useAuth();
  const [, params] = useRoute("/property-selection/:id");
  const propertyId = params?.id || "";

  const { showSnackbar } = useAppSnackbar();

  const [finalImages, setFinalImages] = useState<
    { url: string; category: string }[]
  >([]);

  const rooms = useMemo(() => {
    const map: Record<string, { id: string; name: string; img: string }> = {};

    finalImages.forEach((img) => {
      if (!map[img.category]) {
        map[img.category] = {
          id: String(Object.keys(map).length + 1).padStart(2, "0"),
          name: img.category,
          img: img.url,
        };
      }
    });

    return Object.values(map);
  }, [finalImages]);

  useEffect(() => {
    if (!propertyId || !userId) return;

    const loadFinalImages = async () => {
      try {
        const res = await api.getFinalImages(propertyId, String(userId));
        setFinalImages(res?.images || []);
      } catch {
        showSnackbar("Failed to load final images", "error");
      }
    };

    loadFinalImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, userId]);

  return (
    <Box sx={{ background: "#f6f7f9", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        {/* HEADER */}
        <Stack spacing={1} alignItems="center" mb={6}>
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 28 },
              fontWeight: 400,
              letterSpacing: 1,
            }}
          >
            Final Property Selection
          </Typography>

          <Typography
            fontSize={14}
            color="#6b7280"
            textAlign="center"
            maxWidth={520}
            sx={{ letterSpacing: 1 }}
          >
            Review the final curated space. Each room is optimized for listing
            performance and material procurement.
          </Typography>
        </Stack>

        {/* ROOMS */}
        <Stack spacing={5}>
          {rooms.length === 0 ? (
            <Typography textAlign="center" color="#6b7280">
              No final images available
            </Typography>
          ) : (
            rooms.map((room) => (
              <Box key={room.id}>
                <Stack direction="row" spacing={1} mb={1} alignItems="center">
                  <Typography
                    fontSize={14}
                    fontWeight={700}
                    color="#6b7280"
                    sx={{ letterSpacing: 1 }}
                  >
                    {room.id}
                  </Typography>

                  <Typography fontSize={16} fontWeight={500} color="#111827">
                    {room.name}
                  </Typography>
                </Stack>

                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={room.img}
                    alt={room.name}
                    sx={{
                      height: 360,
                      objectFit: "cover",
                    }}
                  />
                </Card>
              </Box>
            ))
          )}
        </Stack>

        {/* COMPLETION CARD */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: 5,
            borderRadius: "22px",
            border: "1px solid #e5e7eb",
            textAlign: "center",
            background: "#ffffff",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "#000" }} />
          </Box>

          {/* TITLE */}
          <Typography
            fontWeight={600}
            fontSize={20}
            sx={{ letterSpacing: 1 }}
            mb={1}
          >
            Design Selection Complete
          </Typography>

          {/* DESCRIPTION */}
          <Typography
            fontSize={12}
            color="#6b7280"
            mb={3}
            maxWidth={420}
            sx={{ letterSpacing: 1 }}
            mx="auto"
          >
            By generating the workscope, you will receive high-resolution
            renders for MLS, full material procurement lists, and
            contractor-ready project documentation.
          </Typography>

          {/* BUTTON WITH ICON */}
          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              background: "#000",
              borderRadius: 20,
              px: 4,
              py: 1.2,

              textTransform: "none",
              boxShadow: "none",
              "&:hover": { background: "#111", boxShadow: "none" },
            }}
          >
            Generate Full Workscope
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
