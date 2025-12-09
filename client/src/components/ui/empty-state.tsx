import { LucideIcon, Inbox, FileQuestion, Search, Users, Calendar, TestTube, FileText, Package } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: "default" | "subtle" | "card";
    size?: "sm" | "md" | "lg";
}

// Preset icons for common empty states
const presetIcons: Record<string, LucideIcon> = {
    default: Inbox,
    search: Search,
    users: Users,
    patients: Users,
    appointments: Calendar,
    lab: TestTube,
    documents: FileText,
    inventory: Package,
    notFound: FileQuestion,
};

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    actionLabel,
    onAction,
    variant = "default",
    size = "md",
}: EmptyStateProps) {
    const sizeClasses = {
        sm: {
            container: "py-6",
            icon: "h-8 w-8",
            title: "text-sm font-medium",
            description: "text-xs",
        },
        md: {
            container: "py-12",
            icon: "h-12 w-12",
            title: "text-lg font-medium",
            description: "text-sm",
        },
        lg: {
            container: "py-16",
            icon: "h-16 w-16",
            title: "text-xl font-semibold",
            description: "text-base",
        },
    };

    const variantClasses = {
        default: "bg-transparent",
        subtle: "bg-muted/30 rounded-lg",
        card: "bg-card border rounded-lg shadow-sm",
    };

    const sizes = sizeClasses[size];
    const variantClass = variantClasses[variant];

    return (
        <div className={`flex flex-col items-center justify-center text-center ${sizes.container} ${variantClass} px-4`}>
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className={`${sizes.icon} text-muted-foreground`} />
            </div>
            <h3 className={`${sizes.title} text-foreground mb-2`}>{title}</h3>
            {description && (
                <p className={`${sizes.description} text-muted-foreground max-w-sm mb-4`}>
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" size={size === "sm" ? "sm" : "default"}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

// Convenience components for common empty states
export function NoResultsFound({
    searchTerm,
    onClear,
}: {
    searchTerm?: string;
    onClear?: () => void;
}) {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description={searchTerm ? `No items match "${searchTerm}"` : "Try adjusting your search or filters"}
            actionLabel={onClear ? "Clear filters" : undefined}
            onAction={onClear}
        />
    );
}

export function NoDataYet({
    entityName = "items",
    actionLabel,
    onAction,
}: {
    entityName?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <EmptyState
            icon={Inbox}
            title={`No ${entityName} yet`}
            description={`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} will appear here once added`}
            actionLabel={actionLabel}
            onAction={onAction}
        />
    );
}

export function NoPatients({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon={Users}
            title="No patients found"
            description="Register a new patient to get started"
            actionLabel={onAdd ? "Add Patient" : undefined}
            onAction={onAdd}
        />
    );
}

export function NoAppointments({ onSchedule }: { onSchedule?: () => void }) {
    return (
        <EmptyState
            icon={Calendar}
            title="No appointments scheduled"
            description="Schedule an appointment to get started"
            actionLabel={onSchedule ? "Schedule Appointment" : undefined}
            onAction={onSchedule}
        />
    );
}

export function NoLabOrders({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={TestTube}
            title="No lab orders found"
            description="Create a lab order to get started"
            actionLabel={onCreate ? "Create Lab Order" : undefined}
            onAction={onCreate}
        />
    );
}

export default EmptyState;

