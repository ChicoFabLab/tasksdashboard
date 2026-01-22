# MUI Conversion Guide

## Component Mapping

### Tailwind → MUI Conversion

| Old (Tailwind) | New (MUI) | Notes |
|----------------|-----------|-------|
| `<div className="bg-white rounded-lg">` | `<Card>` | Use Card for containers |
| `<h1 className="text-3xl font-bold">` | `<Typography variant="h3">` | Typography for text |
| `<button className="bg-purple-600">` | `<Button variant="contained">` | Button component |
| `<span className="px-2 py-1 rounded">` | `<Chip label="Text" />` | Chips for badges |
| `<div className="flex gap-2">` | `<Stack direction="row" spacing={2}>` | Stack for flex layouts |
| `<div className="grid grid-cols-3">` | `<Grid container spacing={2}>` | Grid for layouts |

## Example Conversions

### Task Card (Before - Tailwind):
```tsx
<div className="bg-white rounded-lg shadow hover:shadow-lg p-6">
  <h3 className="text-lg font-semibold text-gray-900">
    {task.title}
  </h3>
  <p className="text-gray-600 text-sm">
    {task.description}
  </p>
  <button className="px-3 py-2 bg-purple-600 text-white rounded-lg">
    Claim
  </button>
</div>
```

### Task Card (After - MUI):
```tsx
<Card>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      {task.title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {task.description}
    </Typography>
    <Button variant="contained" sx={{ mt: 2 }}>
      Claim
    </Button>
  </CardContent>
</Card>
```

## Quick Conversion Script

For each page, follow these steps:

1. **Import MUI components** at the top
2. **Replace div containers** with appropriate MUI components
3. **Replace text elements** with Typography
4. **Replace buttons** with Button
5. **Replace badges/tags** with Chip
6. **Update spacing** using Stack or sx prop
7. **Remove Tailwind classes**

## Files to Convert (Priority Order):

1. ✅ `/volunteer/tasks/page.tsx` - Main dashboard
2. `/task/[id]/page.tsx` - Task details
3. `/task/create/page.tsx` - Create task
4. `/display/page.tsx` - Public display
5. `/creations/page.tsx` - Community creations
6. Components in `/src/components/`

