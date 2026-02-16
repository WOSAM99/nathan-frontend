import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

export default function ProfileMenu() {
  const [, setLocation] = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(async () => {
    handleMenuClose();
    await api.logout();
    setLocation("/");
  }, [handleMenuClose, setLocation]);

  return (
    <Box>
      {/* Avatar */}
      <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: "#F3F5F7",
            color: "#000",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid #e5e7eb",
          }}
        >
          JD
        </Avatar>
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            },
          },
          list: {
            sx: {
              p: 0,
              "& .MuiMenuItem-root + .MuiDivider-root": {
                marginTop: 0,
                marginBottom: 0,
              },
              "& .MuiDivider-root + .MuiMenuItem-root": {
                marginTop: 0,
              },
            },
          },
        }}
      >
        {/* Label */}
        <Box sx={{ px: 2, py: 1.2 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            My Account
          </Typography>
        </Box>

        <Divider />

        {/* Profile Item */}
        <MenuItem
          onClick={handleMenuClose}
          sx={{
            px: 2,
            py: 1.2,
            gap: 1.5,
          }}
        >
          <PersonOutlineOutlinedIcon fontSize="small" />
          <Typography sx={{ letterSpacing: 1, fontSize: 14 }}>
            Profile
          </Typography>
        </MenuItem>

        {/* Settings Item */}
        <MenuItem
          onClick={handleMenuClose}
          sx={{
            px: 2,
            py: 1.2,
            gap: 1.5,
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
          <Typography sx={{ letterSpacing: 1, fontSize: 14 }}>
            Settings
          </Typography>
        </MenuItem>

        <Divider />

        {/* Logout */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            px: 2,
            py: 1.2,
            gap: 1.5,
            color: "#e53935",
            "&:hover": {
              backgroundColor: "#fdecea",
            },
          }}
        >
          <LogoutOutlinedIcon fontSize="small" />
          <Typography sx={{ letterSpacing: 1, fontSize: 14 }}>
            Log out
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
