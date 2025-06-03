import {
  User, UserCheck, Users, UserPlus, UserX, UserCog,
  Heart, Activity, Monitor, TrendingUp, TrendingDown,
  Pill, Syringe, Beaker, FlaskConical, TestTube, Microscope,
  Calendar, CalendarDays, Clock, Timer, CalendarCheck, CalendarX,
  FileText, FileCheck, FilePlus, FileX, Files, Folder,
  MessageSquare, MessageCircle, Mail, Phone, Video, Mic,
  Stethoscope, Thermometer, Scale, Zap, Eye, Ear,
  Building2, Home, MapPin, Navigation, Car, Truck,
  Plus, Minus, X, Check, AlertCircle, AlertTriangle,
  Settings, Cog, Edit, Trash2, Save, Download, Upload,
  Search, Filter, SortAsc, SortDesc, MoreVertical, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight,
  Bell, BellRing, Flag, Bookmark, Star,
  Shield, ShieldCheck, Lock, Unlock, Key,
  Camera, Image, Paperclip, Link, QrCode, Barcode,
  Printer, Share, Copy, ExternalLink, RefreshCw, RotateCcw,
  Info, HelpCircle, CheckCircle, XCircle, AlertOctagon,
  Database, Server, Cloud, Wifi, WifiOff, Signal,
  Layout, LayoutGrid, LayoutList, Table, Grid, List,
  Target, Crosshair, Focus, Maximize, Minimize, Move,
  PlayCircle, PauseCircle, StopCircle, SkipForward, SkipBack,
  Volume2, VolumeX, MicOff, Headphones,
  CreditCard, DollarSign, Receipt, Wallet, PiggyBank,
  Package, ShoppingCart, Tag, Tags, Percent
} from "lucide-react";

// Healthcare Professional Icons
export const MedicalIcons = {
  // Patient & People Management
  patient: User,
  patients: Users,
  addPatient: UserPlus,
  removePatient: UserX,
  patientProfile: UserCheck,
  patientSettings: UserCog,
  
  // Vital Signs & Monitoring
  vitals: Activity,
  heartRate: Heart,
  bloodPressure: Heart,
  monitor: Monitor,
  temperature: Thermometer,
  weight: Scale,
  pulseOx: Zap,
  vision: Eye,
  hearing: Ear,
  stethoscope: Stethoscope,
  trending: TrendingUp,
  declining: TrendingDown,
  
  // Medications & Pharmacy
  medication: Pill,
  prescription: FileText,
  injection: Syringe,
  pharmacy: Building2,
  dosage: Pill,
  
  // Laboratory & Diagnostics
  labTest: TestTube,
  labResults: Beaker,
  microscope: Microscope,
  bloodTest: FlaskConical,
  urinalysis: TestTube,
  
  // Appointments & Scheduling
  appointment: Calendar,
  schedule: CalendarDays,
  clock: Clock,
  timer: Timer,
  confirmed: CalendarCheck,
  cancelled: CalendarX,
  
  // Documentation & Records
  medicalRecord: FileText,
  document: Files,
  folder: Folder,
  note: FileText,
  report: FileCheck,
  newDocument: FilePlus,
  deleteDocument: FileX,
  
  // Communication
  message: MessageSquare,
  chat: MessageCircle,
  email: Mail,
  phone: Phone,
  videoCall: Video,
  microphone: Mic,
  
  // Alerts & Notifications
  alert: AlertTriangle,
  warning: AlertTriangle,
  notification: BellRing,
  emergency: AlertOctagon,
  
  // Security & Access Control
  security: Shield,
  verified: ShieldCheck,
  admin: UserCheck,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  
  // Locations & Navigation
  hospital: Building2,
  home: Home,
  location: MapPin,
  navigation: Navigation,
  ambulance: Car,
  transport: Truck,
  
  // Actions & Operations
  add: Plus,
  remove: Minus,
  close: X,
  confirm: Check,
  info: AlertCircle,
  
  // System & Settings
  settings: Settings,
  configure: Cog,
  edit: Edit,
  delete: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  
  // Search & Filtering
  search: Search,
  filter: Filter,
  sortAsc: SortAsc,
  sortDesc: SortDesc,
  menu: MoreVertical,
  options: MoreHorizontal,
  
  // Navigation Controls
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  
  // Status & Feedback
  bell: Bell,
  notification_active: BellRing,
  flag: Flag,
  bookmark: Bookmark,
  star: Star,
  
  // Media & Files
  camera: Camera,
  image: Image,
  attachment: Paperclip,
  link: Link,
  qrCode: QrCode,
  barcode: Barcode,
  
  // Sharing & Export
  print: Printer,
  share: Share,
  copy: Copy,
  external: ExternalLink,
  refresh: RefreshCw,
  undo: RotateCcw,
  
  // Help & Information
  help: HelpCircle,
  information: Info,
  success: CheckCircle,
  error: XCircle,
  critical: AlertOctagon,
  
  // Technology & Data
  database: Database,
  server: Server,
  cloud: Cloud,
  wifi: Wifi,
  offline: WifiOff,
  signal: Signal,
  
  // Layout & UI
  layout: Layout,
  grid: LayoutGrid,
  list: LayoutList,
  table: Table,
  gridView: Grid,
  listView: List,
  
  // Focus & View
  target: Target,
  crosshair: Crosshair,
  focus: Focus,
  maximize: Maximize,
  minimize: Minimize,
  move: Move,
  
  // Media Controls
  play: PlayCircle,
  pause: PauseCircle,
  stop: StopCircle,
  forward: SkipForward,
  back: SkipBack,
  
  // Audio
  volume: Volume2,
  mute: VolumeX,
  micOff: MicOff,
  headphones: Headphones,
  
  // Financial
  payment: CreditCard,
  billing: DollarSign,
  receipt: Receipt,
  wallet: Wallet,
  savings: PiggyBank,
  
  // Inventory & Supply
  inventory: Package,
  supplies: ShoppingCart,
  tag: Tag,
  tags: Tags,
  discount: Percent
};

// Status color mappings for healthcare contexts
export const StatusColors = {
  critical: "text-red-600",
  urgent: "text-orange-600", 
  normal: "text-blue-600",
  stable: "text-green-600",
  pending: "text-yellow-600",
  inactive: "text-gray-400"
};

// Background color mappings
export const StatusBackgrounds = {
  critical: "bg-red-50 border-red-200",
  urgent: "bg-orange-50 border-orange-200",
  normal: "bg-blue-50 border-blue-200", 
  stable: "bg-green-50 border-green-200",
  pending: "bg-yellow-50 border-yellow-200",
  inactive: "bg-gray-50 border-gray-200"
};

// Icon size mappings
export const IconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4", 
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8"
};

// Medical context mappings
export const MedicalContext = {
  vitals: {
    bloodPressure: MedicalIcons.bloodPressure,
    heartRate: MedicalIcons.heartRate,
    temperature: MedicalIcons.temperature,
    weight: MedicalIcons.weight
  },
  appointments: {
    scheduled: MedicalIcons.confirmed,
    pending: MedicalIcons.appointment,
    cancelled: MedicalIcons.cancelled
  },
  patient: {
    profile: MedicalIcons.patientProfile,
    record: MedicalIcons.medicalRecord,
    edit: MedicalIcons.edit
  }
};

// Utility function to get medical icon
export const getMedicalIcon = (
  iconName: keyof typeof MedicalIcons, 
  size: keyof typeof IconSizes = 'md'
) => {
  const IconComponent = MedicalIcons[iconName];
  const sizeClass = IconSizes[size];
  return { IconComponent, className: sizeClass };
};

// Utility function to get status styling
export const getStatusStyling = (status: keyof typeof StatusColors) => ({
  textColor: StatusColors[status],
  background: StatusBackgrounds[status]
});

// Type exports
export type MedicalIconName = keyof typeof MedicalIcons;
export type IconSize = keyof typeof IconSizes;
export type StatusType = keyof typeof StatusColors;