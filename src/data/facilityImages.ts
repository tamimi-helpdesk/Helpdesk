// Facility Visual Illustration Banners for all facilities
import barberBanner from '../assets/images/barbershop_banner_1787749973189.jpg';
import cricketBanner from '../assets/images/cricket_stadium_banner_1787749989700.jpg';
import footballBanner from '../assets/images/football_stadium_banner_1787750002187.jpg';
import multipurposeBanner from '../assets/images/multipurpose_hall_banner_1787750016615.jpg';
import cinemaBanner from '../assets/images/cinema_room_banner_1787750040780.jpg';
import tennisBanner from '../assets/images/tennis_court_banner_1787750055141.jpg';
import cricketNetBanner from '../assets/images/cricket_net_banner_1787750068423.jpg';
import basketballBanner from '../assets/images/basketball_court_banner_1787750082134.jpg';
import isolationBanner from '../assets/images/isolation_room_banner_1787844863196.jpg';
import handoverBanner from '../assets/images/handover_cartoon_banner_1788086644361.jpg';
import parcelBanner from '../assets/images/parcel_cartoon_banner_1788086657559.jpg';
import lostFoundBanner from '../assets/images/lost_found_cartoon_banner_1788086671824.jpg';
import blankFormsBanner from '../assets/images/blank_forms_banner_1788187535649.jpg';
import invoiceBanner from '../assets/images/invoice_banner_1788187550862.jpg';
import announcementBanner from '../assets/images/announcement_banner_1788187567335.jpg';
import helpdeskBanner from '../assets/images/helpdesk_banner_1788187581309.jpg';
import ticketBanner from '../assets/images/ticket_mgmt_banner_1788431505754.jpg';
import slaBanner from '../assets/images/sla_mgmt_banner_1788431520379.jpg';
import workflowBanner from '../assets/images/workflow_banner_1788431535201.jpg';
import emailBanner from '../assets/images/email_mgmt_banner_1788431548618.jpg';

export const FACILITY_BANNER_IMAGES: Record<string, string> = {
  'barber-booking': barberBanner,
  'cricket-ground': cricketBanner,
  'football-ground': footballBanner,
  'multipurpose-room': multipurposeBanner,
  'cinema': cinemaBanner,
  'tennis-court': tennisBanner,
  'cricket-net': cricketNetBanner,
  'basketball-court': basketballBanner,
  'isolation-room': isolationBanner,
  'handover-takenover': handoverBanner,
  'parcel-monitoring': parcelBanner,
  'lost-and-found': lostFoundBanner,
  'blank-forms': blankFormsBanner,
  'invoice-manager': invoiceBanner,
  'announcement-notice': announcementBanner,
  'help-support': helpdeskBanner,
  'ticket-management': ticketBanner,
  'sla-management': slaBanner,
  'automated-workflow': workflowBanner,
  'email-management': emailBanner,
};

export const getFacilityBanner = (facilityId: string): string => {
  return FACILITY_BANNER_IMAGES[facilityId] || FACILITY_BANNER_IMAGES['blank-forms'] || barberBanner;
};
