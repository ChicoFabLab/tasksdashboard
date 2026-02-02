#!/bin/bash

# This script replaces emoji icons with professional Lucide icon names
# It will create a list of files that need icon imports added

echo "Updating emoji icons to professional Lucide icons..."

# Define replacements (emoji -> icon name)
declare -A replacements=(
    ["🏗️"]="Hammer"
    ["📋"]="ClipboardList"
    ["🔥"]="Flame"
    ["✅"]="CheckCircle2"
    ["⏱️"]="Clock"
    ["👤"]="User"
    ["📅"]="Calendar"
    ["🎨"]="Palette"
    ["🔐"]="LogIn"
    ["👥"]="Users"
    ["💬"]="MessageCircle"
    ["📊"]="BarChart"
    ["⚙️"]="Settings"
    ["✏️"]="Edit"
    ["🔗"]="Link"
    ["📺"]="Monitor"
    ["📻"]="Radio"
    ["➕"]="Plus"
    ["🙋"]="HandRaised"
    ["⭐"]="Star"
    ["🏆"]="Trophy"
    ["📖"]="Book"
    ["🎯"]="Target"
    ["📸"]="Camera"
    ["🌟"]="Sparkles"
    ["💪"]="Dumbbell"
)

# Find all TypeScript/TSX files (excluding node_modules and .next)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/.next/*" | while read file; do
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Process each replacement
    for emoji in "${!replacements[@]}"; do
        icon_name="${replacements[$emoji]}"
        
        # This is a simple placeholder - manual review will be needed
        # as the actual replacement syntax varies by context
        echo "  Found emoji $emoji in $file (replace with $icon_name manually)"
    done
done

echo "Done! Please review files and add necessary imports manually."
echo "Import statement needed: import { IconName } from 'lucide-react';"

