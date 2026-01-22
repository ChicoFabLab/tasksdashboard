'use client';

import { 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  Box 
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';

export default function TestMUIPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          🎨 MUI Dark Theme Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          If you see a beautiful dark theme, MUI is working! ✨
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Buttons Section */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Buttons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Primary Button
              </Button>
              <Button variant="outlined" startIcon={<CheckIcon />}>
                Outlined Button
              </Button>
              <Button variant="text" startIcon={<SettingsIcon />}>
                Text Button
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Chips Section */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Status Chips
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
              <Chip label="Open" color="success" />
              <Chip label="In Progress" color="primary" />
              <Chip label="Completed" color="default" />
              <Chip label="Woodshop" color="warning" />
              <Chip label="Electronics" color="info" />
            </Stack>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Card Example
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is what a task card will look like with the new dark theme.
              </Typography>
              <Chip label="Purple gradient on hover!" size="small" />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modern & Sleek
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Notice the smooth animations and professional appearance!
              </Typography>
              <Button variant="contained" size="small">
                Looks Good! 🚀
              </Button>
            </CardContent>
          </Card>
        </Stack>

        {/* Colors Section */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Theme Colors
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2 }}>
                <Typography>Primary</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'secondary.main', borderRadius: 2 }}>
                <Typography>Secondary</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'success.main', borderRadius: 2 }}>
                <Typography>Success</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'warning.main', borderRadius: 2 }}>
                <Typography>Warning</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'error.main', borderRadius: 2 }}>
                <Typography>Error</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            ✅ MUI is Working!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ready to modernize your entire site
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}

