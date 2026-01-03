/**
 * SectionHeader Component
 *
 * Reusable section header with icon and title
 * Used throughout MeetingPrepView for consistent styling
 */

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
}

export function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-md bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white dark:text-gray-900" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#ECECEC]">{title}</h2>
    </div>
  );
}
