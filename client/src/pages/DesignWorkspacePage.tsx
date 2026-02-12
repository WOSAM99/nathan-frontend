import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useRoute } from "wouter";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { useAuth } from "@/contexts/AuthContext";
import { MenuItem } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Check from "@mui/icons-material/Check";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import History from "@mui/icons-material/History";
import AppNavbar from "@/components/AppNavBar";
import { PropertyDetails } from "@/types";

/* ================= DESIGN TOKENS ================= */
const ui = {
  bg: "#F6F7F9",
  white: "#FFFFFF",
  border: "#E5E7EB",
  muted: "#6B7280",
  text: "#111827",
  primary: "#0B1320",
  blue: "#2563EB",
  cardRadius: 4,
};

export default function DesignWorkspacePage() {
  const { showSnackbar } = useAppSnackbar();
  const { userId } = useAuth();
  const [, params] = useRoute("/studio/:id");
  const propertyId = params?.id || "";
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [activeSpace, setActiveSpace] = useState<string>("Kitchen");
  const [spaces, setSpaces] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"compare" | "single">("single");
  const [spaceImages, setSpaceImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [compsImages, setCompsImages] = useState<any>();
  const [selectedBaselineIds, setSelectedBaselineIds] = useState<string[]>([]);
  const [selectedCompsIds, setSelectedCompsIds] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [iterationHistory, setIterationHistory] = useState<
    { v: string; url: string; description: string }[]
  >([]);
  const [versionCounter, setVersionCounter] = useState<number>(1.1);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  const selectedImages = useMemo(
    () => compsImages?.addresses?.[selectedAddress]?.images || [],
    [],
  );

  const toggleBaselineSelect = useCallback((id: string) => {
    setSelectedBaselineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleCompsSelect = useCallback((id: string) => {
    setSelectedCompsIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleViewMode = useCallback(
    (
      _event: React.MouseEvent<HTMLElement>,
      newMode: "compare" | "single" | null,
    ) => {
      if (newMode) setViewMode(newMode);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    chatEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleNext = useCallback((e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < spaceImages?.length - 1 ? prev + 1 : 0));
  }, []);

  const handlePrev = useCallback((e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : spaceImages?.length - 1));
  }, []);

  const handleExecute = useCallback(async () => {
    if (selectedBaselineIds?.length === 0 && selectedCompsIds?.length === 0) {
      showSnackbar(
        "Please select at least one image (Baseline or Market Comps) to generate a new design",
        "warning",
      );
      return;
    }

    if (!inputText?.trim()) return;

    const userMessage = inputText;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    setInputText("");

    // Show generating message
    setIsGenerating(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Generating your design..." },
    ]);

    const images: Record<string, string> = {};

    // Baseline images
    selectedBaselineIds?.forEach((id) => {
      const img = spaceImages?.find((i) => i.id === id);
      if (img) {
        images[id] = img?.category || activeSpace;
      }
    });

    // Comps images
    selectedCompsIds?.forEach((id) => {
      const img = selectedImages?.find((i: any) => i.id === id);
      if (img) {
        images[id] = img?.category || selectedAddress;
      }
    });

    const payload = {
      property_id: propertyId,
      images,
      user_feedback: userMessage,
      user_id: userId,
    };

    try {
      const res = await api.regenerateDesign(payload);

      const newImageUrl = res?.regenerated_images?.[0]?.url;

      if (!newImageUrl) {
        throw new Error("No image returned");
      }

      // Remove loading message
      setIsGenerating(false);
      setMessages((prev) => prev.slice(0, -1));

      // Add real AI message
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res?.description || "New design generated.",
        },
      ]);

      // SET CURRENT ITERATION IMAGE
      setCurrentImage(newImageUrl);

      // ADD TO ITERATION HISTORY
      const newVersion = `v${versionCounter?.toFixed(1)}`;

      setIterationHistory((prev) => [
        {
          v: newVersion,
          url: newImageUrl,
          description: res?.description,
        },
        ...prev,
      ]);

      // Increment version
      setVersionCounter((v) => v + 0.1);
    } catch (err) {
      setIsGenerating(false);
      setMessages((prev) => prev.slice(0, -1));
      showSnackbar("Failed to regenerate design", "error");
    }
  }, [
    userId,
    propertyId,
    selectedAddress,
    selectedBaselineIds,
    selectedCompsIds,
    versionCounter,
  ]);

  const loadDetails = useCallback(async () => {
    try {
      const details = await api?.getPropertyDetails(propertyId, String(userId));

      setPropertyDetails(details);

      // ---------- GET MLS IMAGES ----------
      const mlsImages = details?.files?.mls_images?.images || [];

      // ---------- EXTRACT SPACES (KEEP UNKNOWN) ----------
      const extractedSpaces: string[] = Array.from(
        new Set(
          mlsImages.map((img: any) => {
            const cat = img?.category as string | undefined;

            return cat && cat?.includes("-")
              ? cat.split("-").slice(1).join("-").trim()
              : cat || "Unknown";
          }),
        ),
      );

      // Sort alphabetically
      extractedSpaces?.sort();

      // Move "Unknown" to the bottom if present
      const unknownIndex = extractedSpaces?.indexOf("unknown");
      if (unknownIndex !== -1) {
        extractedSpaces?.splice(unknownIndex, 1);
        extractedSpaces?.push("Unknown");
      }

      const finalSpaces =
        extractedSpaces?.length > 0
          ? extractedSpaces
          : ["Kitchen", "Living Room"];

      setSpaces(finalSpaces);

      // ---------- GROUP IMAGES BY ROOM (INCLUDING UNKNOWN) ----------
      const groupedImages: Record<string, any[]> = {};

      mlsImages?.forEach((img: any) => {
        let room =
          img?.category && img?.category?.includes("-")
            ? img?.category.split("-").slice(1).join("-").trim()
            : img?.category || "Unknown";

        if (!groupedImages[room]) groupedImages[room] = [];
        groupedImages[room]?.push(img);
      });

      // ---------- SET DEFAULT IMAGES ----------
      const firstSpace = finalSpaces[0];

      setSpaceImages(groupedImages[firstSpace] || mlsImages);

      setActiveSpace(firstSpace);

      // ---------- STORE COMPS IMAGES ----------
      const comps = details?.files?.comps_images || [];
      setCompsImages(comps);

      const firstAddress = comps ? Object.keys(comps?.addresses)[0] : "";
      setSelectedAddress(firstAddress);
    } catch (err) {
      showSnackbar("Failed to load property details", "error");
    }
  }, [userId, propertyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSpace]);

  useEffect(() => {
    if (!propertyId || !userId) {
      return;
    }

    loadDetails();
  }, [userId, propertyId]);

  useEffect(() => {
    if (iterationHistory?.length === 0) {
      setViewMode("single");
    }
  }, [iterationHistory]);

  useEffect(() => {
    if (!propertyDetails) return;

    const mlsImages = propertyDetails?.files?.mls_images?.images || [];

    const imagesForSpace = mlsImages?.filter((img: any) => {
      const raw = img?.category || "";

      const room =
        raw && raw?.includes("-")
          ? raw?.split("-").slice(1).join("-").trim()
          : raw;

      return room?.toLowerCase() === activeSpace?.toLowerCase();
    });

    setSpaceImages(imagesForSpace);
  }, [propertyDetails, activeSpace]);

  return (
    <Box minHeight="100vh" bgcolor={ui.bg}>
      <AppNavbar exportPackage={true} />

      {/* ================= MAIN LAYOUT ================= */}
      <Box
        display={{ xs: "block", md: "flex" }}
        gap={3}
        p={{ xs: 1.5, sm: 2, md: 3 }}
        alignItems="stretch"
        width="100%"
        maxWidth="100vw"
        overflow="hidden"
      >
        {/* ========== LEFT PANEL ========== */}
        <Box
          flex={{ md: 2 }}
          width={{ xs: "100%", md: "calc(100vw - 540px)" }}
          maxWidth="100%"
          sx={{ overflowX: "hidden" }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            {/* LEFT SIDE — TITLE + SUBTITLE */}
            <Box>
              <Typography
                fontWeight={500}
                sx={{ letterSpacing: 1, fontSize: 22 }}
              >
                {`${activeSpace} Transformation`}
              </Typography>

              <Typography
                color={ui.muted}
                sx={{ fontSize: 14, letterSpacing: 1 }}
              >
                ITERATIVE DELTA ANALYSIS
              </Typography>
            </Box>

            {/* RIGHT SIDE — BUTTONS */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewMode}
              size="small"
              sx={{
                p: 1,
                borderRadius: 999,
                backgroundColor: "#fff",
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  border: "none",
                  borderRadius: 999,
                  px: 2.0,
                  py: 0.5,
                  fontSize: 12,
                  color: ui.muted,
                },
                "& .Mui-selected": {
                  backgroundColor: "#F3F4F6",
                  color: ui.primary,
                  fontWeight: 600,
                  boxShadow: "0px 2px 6px rgba(0,0,0,0.08)",
                  "&:hover": {
                    backgroundColor: "#F3F4F6",
                  },
                },
                "& .MuiToggleButton-root.Mui-disabled": {
                  border: "none !important",
                  opacity: 0.5,
                  backgroundColor: "transparent",
                },
              }}
            >
              <ToggleButton
                value="compare"
                disabled={iterationHistory?.length === 0}
              >
                COMPARE
              </ToggleButton>
              <ToggleButton value="single">SINGLE</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* ========== BASELINE + CURRENT ITERATION ========== */}
          <Grid container spacing={3} justifyContent="center">
            {/* ================= BASELINE COLUMN ================= */}
            <Grid
              size={{ xs: 12, md: viewMode === "single" ? 12 : 6 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* HEADER ROW */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    letterSpacing: 1,
                    color: "#000",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  BASELINE
                </Typography>

                <FormControl size="small">
                  <InputLabel>Select Space</InputLabel>
                  <Select
                    value={activeSpace}
                    label="Select Space"
                    onChange={(e) => setActiveSpace(e.target.value)}
                    sx={{
                      minWidth: { xs: 150, sm: 200 },
                      bgcolor: "white",
                      borderRadius: 2,
                    }}
                  >
                    {spaces.map((space) => (
                      <MenuItem key={space} value={space}>
                        {space}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* BASELINE CARD */}
              <Card
                onClick={() =>
                  toggleBaselineSelect(spaceImages[currentIndex]?.id)
                }
                sx={{
                  borderRadius: ui.cardRadius,
                  width: "100%",
                  position: "relative",
                  maxWidth: 420,
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  backgroundColor: "white",
                  border: selectedBaselineIds?.includes(
                    spaceImages[currentIndex]?.id,
                  )
                    ? `3px solid ${ui.blue}`
                    : `1px solid ${ui.border}`,
                  cursor: "pointer",
                }}
              >
                {spaceImages?.length > 0 ? (
                  <>
                    <CardMedia
                      component="img"
                      image={spaceImages[currentIndex]?.url}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: ui.cardRadius,
                      }}
                    />
                    {selectedBaselineIds?.includes(
                      spaceImages[currentIndex]?.id,
                    ) && (
                      <Check
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          bgcolor: ui.blue,
                          color: "white",
                          borderRadius: "50%",
                          p: 0.6,
                        }}
                      />
                    )}

                    <IconButton
                      onClick={(e) => handlePrev(e)}
                      sx={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "white",
                        boxShadow: 2,
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>

                    <IconButton
                      onClick={(e) => handleNext(e)}
                      sx={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "white",
                        boxShadow: 2,
                      }}
                    >
                      <ChevronRight />
                    </IconButton>

                    <Chip
                      label={`${currentIndex + 1} / ${spaceImages?.length}`}
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        bgcolor: "rgba(255,255,255,0.8)",
                      }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: ui.muted,
                    }}
                  >
                    No images for {activeSpace}
                  </Box>
                )}
              </Card>
            </Grid>

            {/* ================= CURRENT ITERATION ================= */}
            {viewMode === "compare" && currentImage && (
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 16,
                      letterSpacing: 1,
                      color: "#2563EB",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    CURRENT ITERATION
                  </Typography>
                </Box>

                <Card
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                    aspectRatio: "4 / 3",
                    borderRadius: ui.cardRadius,
                    overflow: "hidden",
                    backgroundColor: "white",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={currentImage}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Card>
              </Grid>
            )}
          </Grid>

          <Box mt={4}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <History fontSize="small" sx={{ color: ui.muted }} />
                <Typography
                  fontWeight={600}
                  sx={{ fontSize: 16, letterSpacing: 1 }}
                >
                  ITERATION HISTORY
                </Typography>
              </Box>

              {iterationHistory?.length > 0 && (
                <Box display="flex" gap={1}>
                  <IconButton
                    onClick={() =>
                      document.getElementById("iter-carousel")?.scrollBy({
                        left: -320,
                        behavior: "smooth",
                      })
                    }
                    sx={{
                      border: `1px solid ${ui.border}`,
                      bgcolor: "white",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>

                  <IconButton
                    onClick={() =>
                      document.getElementById("iter-carousel")?.scrollBy({
                        left: 320,
                        behavior: "smooth",
                      })
                    }
                    sx={{
                      border: `1px solid ${ui.border}`,
                      bgcolor: "white",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {iterationHistory?.length === 0 ? (
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderRadius: 3,
                  border: `1px solid ${ui.border}`,
                  color: ui.muted,
                }}
              >
                No current iteration history to show
              </Paper>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <Box
                  id="iter-carousel"
                  sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: "auto",
                    scrollBehavior: "smooth",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {iterationHistory?.map((item, i) => (
                    <Paper
                      key={i}
                      sx={{
                        minWidth: "23%",
                        maxWidth: "23%",
                        height: 200,
                        borderRadius: 3,
                        border: `1px solid ${ui.border}`,
                        overflow: "hidden",
                        position: "relative",
                        bgcolor: "white",
                        display: "flex",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: ui.primary,
                          color: "white",
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          fontSize: 11,
                          fontWeight: 600,
                          zIndex: 2,
                        }}
                      >
                        {item.v}
                      </Box>

                      <CardMedia
                        component="img"
                        image={item.url}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ================= MARKET COMPS CAROUSEL ================= */}

          {selectedImages?.length ? (
            <Box mt={4}>
              {/* HEADER + NAV BUTTONS */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                {/* LEFT SIDE — TITLE */}
                <Box display="flex" alignItems="center" gap={1}>
                  <CollectionsOutlined
                    fontSize="small"
                    sx={{ color: ui.muted }}
                  />
                  <Typography
                    fontWeight={600}
                    sx={{ fontSize: 16, letterSpacing: 1 }}
                  >
                    MARKET COMPS
                  </Typography>
                </Box>

                {/* RIGHT SIDE — SELECT + ARROWS */}
                <Box display="flex" alignItems="center" gap={1.5}>
                  {/* SELECT */}
                  <FormControl size="small">
                    <InputLabel>Select Address</InputLabel>
                    <Select
                      value={selectedAddress}
                      label="Select Address"
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      sx={{
                        minWidth: 260,
                        bgcolor: "white",
                        borderRadius: 2,
                      }}
                    >
                      {Object.keys(compsImages?.addresses || {}).map((addr) => (
                        <MenuItem key={addr} value={addr}>
                          {addr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* ARROWS */}
                  <IconButton
                    onClick={() =>
                      document.getElementById("comps-carousel")?.scrollBy({
                        left: -450,
                        behavior: "smooth",
                      })
                    }
                    sx={{
                      border: `1px solid ${ui.border}`,
                      bgcolor: "white",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>

                  <IconButton
                    onClick={() =>
                      document.getElementById("comps-carousel")?.scrollBy({
                        left: 450,
                        behavior: "smooth",
                      })
                    }
                    sx={{
                      border: `1px solid ${ui.border}`,
                      bgcolor: "white",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* WRAPPER CARD */}
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${ui.border}`,
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <Box
                  id="comps-carousel"
                  sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: compsImages?.length > 4 ? "auto" : "hidden",
                    scrollBehavior: "smooth",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    justifyContent:
                      compsImages?.length <= 4 ? "center" : "flex-start",

                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {selectedImages?.map((img: any, i: number) => (
                    <Card
                      key={i}
                      onClick={() => toggleCompsSelect(img.id)}
                      sx={{
                        flexShrink: 0,
                        width: {
                          xs: "100%",
                          sm: "50%",
                          md: "33.33%",
                          lg: "calc(25% - 12px)",
                        },
                        height: 180,
                        borderRadius: 3,
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        border: selectedCompsIds?.includes(img.id)
                          ? `3px solid ${ui.blue}`
                          : `1px solid ${ui.border}`,
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={img.url}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {selectedCompsIds?.includes(img.id) && (
                        <Check
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: ui.blue,
                            color: "white",
                            borderRadius: "50%",
                            p: 0.5,
                          }}
                        />
                      )}
                    </Card>
                  ))}
                </Box>
              </Paper>
            </Box>
          ) : null}
        </Box>
        {/* ========== RIGHT CHAT PANEL ========== */}
        <Box
          mt={{ xs: 4, md: 0 }}
          display="flex"
          flexDirection="column"
          flex={1}
        >
          <Paper
            sx={{
              width: { xs: "100%" },
              p: 2,
              borderRadius: 3,
              border: `1px solid ${ui.border}`,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.06)",
              bgcolor: "#FFFFFF",
              height: "100%",
            }}
          >
            {/* HEADER */}
            <Box display="flex" gap={1} alignItems="center" sx={{ mb: 2 }}>
              <AutoAwesome fontSize="small" sx={{ color: "#000" }} />
              <Typography
                fontWeight={700}
                sx={{ fontSize: 16, letterSpacing: 1 }}
              >
                DESIGN AGENT
              </Typography>
            </Box>

            {/* CHAT BODY */}
            <Box
              ref={chatContainerRef}
              flex={1}
              display="flex"
              flexDirection="column"
              gap={2}
              sx={{
                overflowY: "auto",
                pr: 0.5,
                height: "100%",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {messages?.map((msg, index) =>
                msg?.sender === "ai" ? (
                  <Box
                    key={index}
                    display="flex"
                    gap={1}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "#EAECEF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      <AutoAwesome fontSize="small" />
                    </Box>

                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${ui.border}`,
                        bgcolor: "#F3F5F7",
                        maxWidth: "85%",
                        ...(isGenerating && index === messages?.length - 1
                          ? {
                              animation: "blink 1.2s infinite",
                              "@keyframes blink": {
                                "0%": { opacity: 1 },
                                "50%": { opacity: 0.3 },
                                "100%": { opacity: 1 },
                              },
                            }
                          : {}),
                      }}
                    >
                      {msg?.text}
                    </Paper>
                  </Box>
                ) : (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: ui.primary,
                      color: "white",
                      alignSelf: "flex-end",
                      maxWidth: "85%",
                    }}
                  >
                    {msg?.text}
                  </Paper>
                ),
              )}

              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* INPUT BAR */}
            <Box
              sx={{
                border: `1px solid ${ui.border}`,
                borderRadius: 4,
                backgroundColor: "#F3F5F7",
                px: 2,
                py: 1.6,
                minHeight: 64,
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
              }}
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Direct the AI: 'Change the countertop to marble'..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleExecute();
                  }
                }}
                rows={3}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 15,
                  lineHeight: "1.6",
                  padding: "10px 0",
                  color: ui.text,
                  resize: "none",
                  fontFamily: "inherit",
                  overflow: "hidden",
                  borderRadius: 0,
                }}
              />

              {/* EXECUTE BUTTON */}
              <Button
                variant="contained"
                onClick={handleExecute}
                sx={{
                  bgcolor: ui.primary,
                  color: "white",
                  borderRadius: 3,
                  px: 2.2,
                  minHeight: 44,
                  textTransform: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  "&:hover": { bgcolor: ui.primary },
                }}
              >
                EXECUTE <ChevronRight fontSize="small" />
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
