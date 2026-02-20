import {
  Box,
  Button,
  Card,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
} from "@mui/material";
import Check from "@mui/icons-material/Check";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { useLocation } from "wouter";
import { useState } from "react";
import { api } from "@/lib/api";

const ui = {
  border: "#E5E7EB",
  muted: "#6B7280",
  blue: "#2563EB",
};

export default function FinalSelectionModal({
  setExportSelections,
  exportSelections,
  groupedIterations,
  setExportOpen,
  exportOpen,
  propertyId,
  userId,
}: any) {
  const { showSnackbar } = useAppSnackbar();
  const [, setLocation] = useLocation();

  const [isExporting, setIsExporting] = useState(false);

  const totalSelected = Object.values(exportSelections).flat().length;

  return (
    <Dialog
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: "60vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>Select Images for Export</DialogTitle>

      {/* SCROLLABLE CONTENT */}
      <DialogContent
        dividers
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#D1D5DB",
            borderRadius: 3,
          },
        }}
      >
        {Object.keys(groupedIterations).length === 0 ? (
          <Typography>No iterations available</Typography>
        ) : (
          Object.entries(groupedIterations).map(([category, items]: any) => (
            <Box key={category} mb={3}>
              {/* CATEGORY HEADER WITH COUNT */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography fontWeight={600}>{category}</Typography>

                <Chip
                  label={
                    items.length > 1
                      ? `${items.length} images`
                      : `${items.length} image`
                  }
                  size="small"
                  sx={{
                    bgcolor: "#EEF2FF",
                    color: "#000",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              </Box>

              {/* IMAGE GRID */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 2,
                }}
              >
                {items.map((item: any) => {
                  const selected = exportSelections[category]?.some(
                    (i: any) => i.url === item.url,
                  );

                  return (
                    <Card
                      key={item.url}
                      onClick={async () => {
                        const selectedImages = Object.entries(
                          exportSelections,
                        ).flatMap(([category, items]: any) =>
                          items.map((i: any) => ({
                            category,
                            url: i.url,
                            description: i.description,
                          })),
                        );

                        if (selectedImages.length === 0) {
                          showSnackbar("Select at least one image", "warning");
                          return;
                        }

                        try {
                          setIsExporting(true);

                          await api.storeFinalImages({
                            property_id: propertyId,
                            user_id: String(userId),
                            images: selectedImages,
                          });

                          showSnackbar("Export successful", "success");

                          setExportOpen(false);
                          setExportSelections({});

                          setLocation("/property-selection");
                        } catch (err) {
                          showSnackbar("Export failed", "error");
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      sx={{
                        position: "relative",
                        cursor: "pointer",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: selected
                          ? `1.5px solid ${ui.blue}`
                          : `1px solid ${ui.border}`,
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={item.url}
                        sx={{
                          height: 120,
                          objectFit: "cover",
                        }}
                      />

                      {selected && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                          }}
                        />
                      )}

                      {/* CHECK ICON */}
                      {selected && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: ui.blue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                          }}
                        >
                          <Check sx={{ fontSize: 16, color: "#fff" }} />
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Box>
            </Box>
          ))
        )}
      </DialogContent>

      {/* STICKY FOOTER */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: "space-between",
        }}
      >
        <Typography fontSize={13} color={ui.muted}>
          {totalSelected} selected
        </Typography>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            disabled={totalSelected === 0}
            sx={{ bgcolor: "#000", color: "#fff" }}
            color="inherit"
            onClick={() => {
              const selectedImages = Object.entries(exportSelections).flatMap(
                ([category, items]: any) =>
                  items.map((i: any) => ({
                    category,
                    url: i.url,
                    description: i.description,
                  })),
              );

              if (selectedImages.length === 0) {
                showSnackbar("Select at least one image", "warning");
                return;
              }

              setExportOpen(false);
              setExportSelections({});
              setLocation("/property-selection");
            }}
          >
            EXPORT
          </Button>
          <Button
            onClick={() => {
              setExportOpen(false);
              setExportSelections({});
            }}
            color="inherit"
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
