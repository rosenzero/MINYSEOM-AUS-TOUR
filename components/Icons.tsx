import type { ComponentType } from 'react';
import type { IconBaseProps } from 'react-icons';
import {
  LuMapPin,
  LuArrowLeftRight,
  LuBriefcase,
  LuPlane,
  LuPlaneTakeoff,
  LuPlaneLanding,
  LuSun,
  LuGlobe,
  LuRefreshCw,
  LuTriangleAlert,
  LuMap,
  LuMessageSquare,
  LuClipboard,
  LuCheck,
  LuSparkles,
  LuEllipsis,
  LuTimer,
  LuClock,
  LuLuggage,
  LuTicket,
  LuDoorOpen,
  LuExternalLink,
  LuX,
} from 'react-icons/lu';

type IconCmp = ComponentType<IconBaseProps>;
export type IconProps = IconBaseProps & { size?: number };

function wrap(Cmp: IconCmp, extra?: Partial<IconBaseProps>): ComponentType<IconProps> {
  const Wrapped = ({ size = 16, ...rest }: IconProps) => (
    <Cmp size={size} aria-hidden {...extra} {...rest} />
  );
  Wrapped.displayName = (Cmp as { displayName?: string }).displayName ?? 'Icon';
  return Wrapped;
}

export const MapPinIcon = wrap(LuMapPin);
export const ExchangeIcon = wrap(LuArrowLeftRight);
export const BriefcaseIcon = wrap(LuBriefcase);
export const PlaneIcon = wrap(LuPlane);
export const PlaneTakeoffIcon = wrap(LuPlaneTakeoff);
export const PlaneLandingIcon = wrap(LuPlaneLanding);
export const SunIcon = wrap(LuSun);
export const GlobeIcon = wrap(LuGlobe);
export const RefreshIcon = wrap(LuRefreshCw);
export const WarnIcon = wrap(LuTriangleAlert);
export const MapIcon = wrap(LuMap);
export const ChatIcon = wrap(LuMessageSquare);
export const ClipboardIcon = wrap(LuClipboard);
export const CheckIcon = wrap(LuCheck);
export const SparkleIcon = wrap(LuSparkles);
export const MoreIcon = wrap(LuEllipsis);
export const TimerIcon = wrap(LuTimer);
export const ClockIcon = wrap(LuClock);
export const LuggageIcon = wrap(LuLuggage);
export const TicketIcon = wrap(LuTicket);
export const GateIcon = wrap(LuDoorOpen);
export const ExternalLinkIcon = wrap(LuExternalLink);
export const CloseIcon = wrap(LuX);
