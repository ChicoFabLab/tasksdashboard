import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Box,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Task } from '@/lib/pocketbase';
import { formatTime } from '@/lib/utils';
import pb from '@/lib/pocketbase';

interface MuiTaskCardProps {
  task: Task;
  volunteerId?: string;
  onClaim?: (taskId: string) => void;
  onUnclaim?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  showActions?: boolean;
}

const zoneColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'Woodshop': 'warning',
  '3D Printing': 'secondary',
  'Electronics': 'info',
  'Laser Cutting': 'error',
  'CNC': 'success',
  'General': 'default',
  'Admin': 'primary',
};

export default function MuiTaskCard({
  task,
  volunteerId,
  onClaim,
  onUnclaim,
  onComplete,
  showActions = true,
}: MuiTaskCardProps) {
  const isAssignedToMe = volunteerId && (
    Array.isArray(task.assigned_to)
      ? task.assigned_to.includes(volunteerId)
      : task.assigned_to === volunteerId
  );

  const handleCopyLink = () => {
    const taskUrl = `${window.location.origin}/task/${task.id}`;
    navigator.clipboard.writeText(taskUrl);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Task Image */}
      {task.image && (
        <Box
          component="img"
          src={pb.files.getURL(task, task.image, { thumb: '400x300' })}
          alt={task.title}
          sx={{
            width: '100%',
            height: 200,
            objectFit: 'cover',
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            #{task.task_number}
          </Typography>
          <Chip 
            label={task.zone} 
            size="small"
            color={zoneColors[task.zone] || 'default'}
          />
        </Stack>

        {/* Title */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {task.title}
        </Typography>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.description}
        </Typography>

        {/* Creator and Date Info */}
        {(task.creator_name || task.created) && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            {task.creator_name && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="text.secondary">
                  {task.creator_name}
                </Typography>
              </Stack>
            )}
            {task.created && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(task.created).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Stack>
            )}
          </Box>
        )}

        {/* Estimated Time */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatTime(task.estimated_minutes)}
          </Typography>
        </Stack>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            {isAssignedToMe ? (
              <>
                {onUnclaim && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => onUnclaim(task.id)}
                  >
                    Unclaim
                  </Button>
                )}
                {onComplete && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onComplete(task.id)}
                  >
                    Complete
                  </Button>
                )}
              </>
            ) : (
              onClaim && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onClaim(task.id)}
                >
                  Claim
                </Button>
              )
            )}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              href={`/task/edit/${task.id}`}
              sx={{ color: 'info.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleCopyLink}
              sx={{ color: 'text.secondary' }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Stack>
        </CardActions>
      )}
    </Card>
  );
}

