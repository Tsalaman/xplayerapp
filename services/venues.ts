import { supabase } from './supabase';
import { Venue, Sport } from '../types';
import { Cursor, encodeCursor, decodeCursor } from '../utils/cursor';

function mapVenueFromDb(dbVenue: any): Venue {
  return {
    id: dbVenue.id,
    name: dbVenue.name,
    description: dbVenue.description || undefined,
    sport: dbVenue.sport,
    address: dbVenue.address,
    latitude: dbVenue.latitude ? parseFloat(dbVenue.latitude) : undefined,
    longitude: dbVenue.longitude ? parseFloat(dbVenue.longitude) : undefined,
    isPublic: dbVenue.is_public,
    ownerId: dbVenue.owner_id || undefined,
    ownerEmail: dbVenue.owner_email || undefined,
    phone: dbVenue.phone || undefined,
    website: dbVenue.website || undefined,
    pricePerHour: dbVenue.price_per_hour ? parseFloat(dbVenue.price_per_hour) : undefined,
    listingFee: dbVenue.listing_fee ? parseFloat(dbVenue.listing_fee) : undefined,
    listingStatus: dbVenue.listing_status,
    listingExpiresAt: dbVenue.listing_expires_at || undefined,
    allowsBooking: dbVenue.allows_booking,
    bookingPricePerHour: dbVenue.booking_price_per_hour ? parseFloat(dbVenue.booking_price_per_hour) : undefined,
    amenities: dbVenue.amenities || [],
    images: dbVenue.images || [],
    rating: dbVenue.rating ? parseFloat(dbVenue.rating) : 0,
    ratingCount: dbVenue.rating_count || 0,
    createdAt: dbVenue.created_at,
    updatedAt: dbVenue.updated_at,
  };
}

export interface CreateVenueData {
  name: string;
  description?: string;
  sport: Sport;
  address: string;
  latitude?: number;
  longitude?: number;
  isPublic: boolean;
  ownerEmail?: string;
  phone?: string;
  website?: string;
  pricePerHour?: number;
  listingFee?: number;
  allowsBooking?: boolean;
  bookingPricePerHour?: number;
  amenities?: string[];
  images?: string[];
}

export const venueService = {
  // Get public venues
  getPublicVenues: async (sport?: Sport): Promise<Venue[]> => {
    let query = supabase
      .from('venues')
      .select('*')
      .eq('is_public', true)
      .eq('listing_status', 'active');

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data, error } = await query
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapVenueFromDb) : [];
  },

  // Get all active venues (public + paid listings)
  getActiveVenues: async (sport?: Sport): Promise<Venue[]> => {
    let query = supabase
      .from('venues')
      .select('*')
      .eq('listing_status', 'active');

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data, error } = await query
      .order('is_public', { ascending: false }) // Public venues first
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapVenueFromDb) : [];
  },

  // Get nearby venues with cursor pagination
  getNearbyVenuesPaginated: async (
    userLat: number,
    userLng: number,
    radiusKm: number = 10.0,
    cursor: Cursor = null,
    sport?: Sport,
    limit: number = 20
  ): Promise<{ data: Venue[]; nextCursor: Cursor; hasMore: boolean }> => {
    // Build cursor filter
    let cursorFilter = null;
    if (cursor) {
      const decoded = decodeCursor(cursor);
      cursorFilter = decoded;
    }

    const { data, error: rpcError } = await supabase.rpc('search_nearby_venues', {
      user_lat: userLat,
      user_lng: userLng,
      radius_km: radiusKm,
      sport_filter: sport || null,
      cursor_distance: cursorFilter?.distance_km || cursorFilter?.distance || null,
      cursor_id: cursorFilter?.id || null,
      limit_count: limit + 1, // Get one extra to check hasMore
    });

    if (rpcError) throw rpcError;

    // Map database response to Venue with distance
    const mappedVenues: Venue[] = (data || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      description: v.description || undefined,
      sport: v.sport,
      address: v.address,
      latitude: v.latitude ? parseFloat(v.latitude) : undefined,
      longitude: v.longitude ? parseFloat(v.longitude) : undefined,
      distanceKm: v.distance_km ? parseFloat(v.distance_km) : undefined,
      isPublic: v.is_public,
      ownerId: v.owner_id || undefined,
      ownerEmail: v.owner_email || undefined,
      phone: v.phone || undefined,
      website: v.website || undefined,
      pricePerHour: v.price_per_hour ? parseFloat(v.price_per_hour) : undefined,
      listingStatus: v.listing_status,
      allowsBooking: v.allows_booking,
      bookingPricePerHour: v.booking_price_per_hour ? parseFloat(v.booking_price_per_hour) : undefined,
      amenities: v.amenities || [],
      images: v.images || [],
      rating: v.rating ? parseFloat(v.rating) : 0,
      ratingCount: v.rating_count || 0,
      createdAt: '', // Will be populated from other queries if needed
      updatedAt: '', // Will be populated from other queries if needed
    }));

    const resultHasMore = mappedVenues.length > limit;
    const venuesToReturn = resultHasMore ? mappedVenues.slice(0, limit) : mappedVenues;

    // Generate next cursor from last item {distance_km, id}
    // Note: cursor uses distance_km key for compatibility
    const newNextCursor = venuesToReturn.length > 0 && resultHasMore
      ? encodeCursor({
          distance_km: venuesToReturn[venuesToReturn.length - 1].distanceKm || 0,
          distance: venuesToReturn[venuesToReturn.length - 1].distanceKm || 0, // Alias for compatibility
          id: venuesToReturn[venuesToReturn.length - 1].id,
        })
      : null;

    return {
      data: venuesToReturn,
      nextCursor: newNextCursor,
      hasMore: resultHasMore,
    };
  },

  // Get venue by ID
  getVenue: async (venueId: string): Promise<Venue | null> => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapVenueFromDb(data) : null;
  },

  // Create venue (public or private)
  createVenue: async (venueData: CreateVenueData, userId?: string): Promise<Venue> => {
    const dbData = {
      name: venueData.name,
      description: venueData.description || null,
      sport: venueData.sport,
      address: venueData.address,
      latitude: venueData.latitude || null,
      longitude: venueData.longitude || null,
      is_public: venueData.isPublic,
      owner_id: userId || null,
      owner_email: venueData.ownerEmail || null,
      phone: venueData.phone || null,
      website: venueData.website || null,
      price_per_hour: venueData.pricePerHour || null,
      listing_fee: venueData.listingFee || null,
      listing_status: venueData.isPublic ? 'active' : 'pending', // Private venues need payment
      listing_expires_at: venueData.isPublic ? null : null, // Set expiration for paid listings
      allows_booking: venueData.allowsBooking || false,
      booking_price_per_hour: venueData.bookingPricePerHour || null,
      amenities: venueData.amenities || [],
      images: venueData.images || [],
    };

    const { data, error } = await supabase
      .from('venues')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapVenueFromDb(data);
  },

  // Update venue (owner only)
  updateVenue: async (
    venueId: string,
    updates: Partial<CreateVenueData>,
    userId?: string
  ): Promise<Venue> => {
    // Check ownership for private venues
    if (userId) {
      const { data: venue } = await supabase
        .from('venues')
        .select('owner_id, is_public')
        .eq('id', venueId)
        .single();

      if (venue && !venue.is_public && venue.owner_id !== userId) {
        throw new Error('Only venue owner can update private venues');
      }
    }

    const dbData: any = {};
    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.description !== undefined) dbData.description = updates.description;
    if (updates.sport !== undefined) dbData.sport = updates.sport;
    if (updates.address !== undefined) dbData.address = updates.address;
    if (updates.latitude !== undefined) dbData.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbData.longitude = updates.longitude;
    if (updates.phone !== undefined) dbData.phone = updates.phone;
    if (updates.website !== undefined) dbData.website = updates.website;
    if (updates.pricePerHour !== undefined) dbData.price_per_hour = updates.pricePerHour;
    if (updates.allowsBooking !== undefined) dbData.allows_booking = updates.allowsBooking;
    if (updates.bookingPricePerHour !== undefined) dbData.booking_price_per_hour = updates.bookingPricePerHour;
    if (updates.amenities !== undefined) dbData.amenities = updates.amenities;
    if (updates.images !== undefined) dbData.images = updates.images;

    const { data, error } = await supabase
      .from('venues')
      .update(dbData)
      .eq('id', venueId)
      .select()
      .single();

    if (error) throw error;
    return mapVenueFromDb(data);
  },

  // Activate paid listing (after payment)
  activateListing: async (
    venueId: string,
    expiresAt: string
  ): Promise<Venue> => {
    const { data, error } = await supabase
      .from('venues')
      .update({
        listing_status: 'active',
        listing_expires_at: expiresAt,
      })
      .eq('id', venueId)
      .select()
      .single();

    if (error) throw error;
    return mapVenueFromDb(data);
  },
};

