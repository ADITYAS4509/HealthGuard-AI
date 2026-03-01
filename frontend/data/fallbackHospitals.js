/**
 * Fallback Hospital Database – District-Level Coverage
 * Used when Overpass API is unavailable
 * Format: district → array of {name, lat, lng, phone, type, category}
 */

'use strict';

const FALLBACK_HOSPITALS = {
  'Mumbai, Maharashtra': [
    { name: 'Kokilaben Hospital', lat: 19.1136, lng: 72.8297, phone: '+91-22-4141-4141', type: 'private', category: 'emergency' },
    { name: 'Lilavati Hospital', lat: 19.1147, lng: 72.8198, phone: '+91-22-6719-6969', type: 'private', category: 'emergency' },
    { name: 'Hinduja Hospital', lat: 19.1214, lng: 72.8380, phone: '+91-22-6708-5000', type: 'private', category: 'emergency' },
    { name: 'Fortis Hospital', lat: 19.0844, lng: 72.8779, phone: '+91-22-6617-0000', type: 'private', category: 'emergency' },
    { name: 'BMC Hospital', lat: 19.0196, lng: 72.8295, phone: '+91-22-2386-0666', type: 'govt', category: 'general' }
  ],

  'Bangalore, Karnataka': [
    { name: 'Apollo Hospital Bangalore', lat: 13.0369, lng: 77.5619, phone: '+91-80-4060-4060', type: 'private', category: 'emergency' },
    { name: 'Manipal Hospital', lat: 13.0563, lng: 77.5865, phone: '+91-80-6611-5555', type: 'private', category: 'emergency' },
    { name: 'Fortis Hospital Bangalore', lat: 13.0266, lng: 77.6003, phone: '+91-80-6681-7777', type: 'private', category: 'emergency' },
    { name: 'St. Martha\'s Hospital', lat: 12.9843, lng: 77.5706, phone: '+91-80-4224-2424', type: 'private', category: 'general' },
    { name: 'Victoria Hospital', lat: 12.9762, lng: 77.5939, phone: '+91-80-2660-5577', type: 'govt', category: 'general' }
  ],

  'Delhi, Delhi': [
    { name: 'AIIMS Delhi', lat: 28.5693, lng: 77.2048, phone: '+91-11-2659-3676', type: 'govt', category: 'emergency' },
    { name: 'Apollo Hospital Delhi', lat: 28.5356, lng: 77.1955, phone: '+91-11-4143-1111', type: 'private', category: 'emergency' },
    { name: 'Fortis Hospital Delhi', lat: 28.4595, lng: 77.0266, phone: '+91-11-4141-4141', type: 'private', category: 'emergency' },
    { name: 'Max Super Specialty Hospital', lat: 28.4729, lng: 77.0997, phone: '+91-11-4141-4344', type: 'private', category: 'emergency' },
    { name: 'Safdarjung Hospital', lat: 28.5632, lng: 77.1802, phone: '+91-11-2616-5060', type: 'govt', category: 'general' }
  ],

  'Pune, Maharashtra': [
    { name: 'Ruby Hall Clinic', lat: 18.5409, lng: 73.9132, phone: '+91-20-6630-3000', type: 'private', category: 'emergency' },
    { name: 'Apollo Hospital Pune', lat: 18.5600, lng: 73.9228, phone: '+91-20-4213-5000', type: 'private', category: 'emergency' },
    { name: 'KEM Hospital', lat: 18.5293, lng: 73.8573, phone: '+91-20-2625-7000', type: 'govt', category: 'general' },
    { name: 'Deenanath Mangeshkar Hospital', lat: 18.5308, lng: 73.8599, phone: '+91-20-2566-6666', type: 'private', category: 'emergency' },
    { name: 'Jehangir Hospital', lat: 18.5179, lng: 73.8549, phone: '+91-20-4132-5000', type: 'private', category: 'emergency' }
  ],

  'Chennai, Tamil Nadu': [
    { name: 'Apollo Hospital Chennai', lat: 13.0409, lng: 80.2320, phone: '+91-44-2829-0000', type: 'private', category: 'emergency' },
    { name: 'Fortis Malar Hospital', lat: 13.0511, lng: 80.2321, phone: '+91-44-4478-2222', type: 'private', category: 'emergency' },
    { name: 'Stanley Medical College', lat: 13.0632, lng: 80.1890, phone: '+91-44-2821-6666', type: 'govt', category: 'general' },
    { name: 'Madras Medical College Hospital', lat: 13.0659, lng: 80.2409, phone: '+91-44-2536-3535', type: 'govt', category: 'general' },
    { name: 'Gleneagles Global Hospital', lat: 13.0849, lng: 80.2106, phone: '+91-44-4210-0000', type: 'private', category: 'emergency' }
  ],

  'Kolkata, West Bengal': [
    { name: 'SSKM Hospital', lat: 22.5726, lng: 88.3639, phone: '+91-33-2266-0429', type: 'govt', category: 'general' },
    { name: 'ISI Hospital', lat: 22.4827, lng: 88.3832, phone: '+91-33-2366-1234', type: 'govt', category: 'general' },
    { name: 'Apollo Hospitals Kolkata', lat: 22.5000, lng: 88.3731, phone: '+91-33-6671-9999', type: 'private', category: 'emergency' },
    { name: 'Fortis Hospital Kolkata', lat: 22.5211, lng: 88.3976, phone: '+91-33-6614-0000', type: 'private', category: 'emergency' },
    { name: 'Belle Vue Clinic', lat: 22.5513, lng: 88.3647, phone: '+91-33-2249-0000', type: 'private', category: 'emergency' }
  ],

  'Hyderabad, Telangana': [
    { name: 'Apollo Hospital Hyderabad', lat: 17.3648, lng: 78.4841, phone: '+91-40-2361-0000', type: 'private', category: 'emergency' },
    { name: 'Fortis Hospital Hyderabad', lat: 17.4009, lng: 78.4405, phone: '+91-40-6677-7000', type: 'private', category: 'emergency' },
    { name: 'Continental Hospitals', lat: 17.4065, lng: 78.4475, phone: '+91-40-4040-0000', type: 'private', category: 'emergency' },
    { name: 'Yashoda Hospital', lat: 17.3944, lng: 78.4631, phone: '+91-40-6666-5555', type: 'private', category: 'emergency' },
    { name: 'Osmania General Hospital', lat: 17.4065, lng: 78.4748, phone: '+91-40-2766-3666', type: 'govt', category: 'general' }
  ],

  'Ahmedabad, Gujarat': [
    { name: 'Apollo Hospital Ahmedabad', lat: 23.0225, lng: 72.5714, phone: '+91-79-6636-5000', type: 'private', category: 'emergency' },
    { name: 'Mangalam Hospital', lat: 23.0394, lng: 72.5461, phone: '+91-79-2644-2121', type: 'private', category: 'emergency' },
    { name: 'UK Banasthali', lat: 23.0175, lng: 72.5413, phone: '+91-79-2656-7999', type: 'private', category: 'emergency' },
    { name: 'Sterling Hospital', lat: 23.1449, lng: 72.6249, phone: '+91-79-2644-5555', type: 'private', category: 'emergency' },
    { name: 'Civil Hospital Ahmedabad', lat: 23.0225, lng: 72.5714, phone: '+91-79-2755-0544', type: 'govt', category: 'general' }
  ],

  'Jaipur, Rajasthan': [
    { name: 'Fortis Hospital Jaipur', lat: 26.9124, lng: 75.7873, phone: '+91-141-2220-2020', type: 'private', category: 'emergency' },
    { name: 'Max Hospital Jaipur', lat: 26.9064, lng: 75.8231, phone: '+91-141-3034-3000', type: 'private', category: 'emergency' },
    { name: 'Aravind Eye Hospital', lat: 26.9015, lng: 75.8245, phone: '+91-141-2700-1600', type: 'private', category: 'general' },
    { name: 'Bimaripur Hospital', lat: 26.8765, lng: 75.8106, phone: '+91-141-2222-6666', type: 'private', category: 'general' },
    { name: 'SMS Hospital', lat: 26.9249, lng: 75.8249, phone: '+91-141-2560-0400', type: 'govt', category: 'general' }
  ],

  'Surat, Gujarat': [
    { name: 'Shivangi Hospital', lat: 21.1458, lng: 72.8323, phone: '+91-261-2456-4567', type: 'private', category: 'emergency' },
    { name: 'Unique Hospital', lat: 21.1652, lng: 72.8281, phone: '+91-261-2426-6000', type: 'private', category: 'emergency' },
    { name: 'Mamta Hospital', lat: 21.1507, lng: 72.8247, phone: '+91-261-3988-8888', type: 'private', category: 'general' },
    { name: 'SMC Hospital', lat: 21.1796, lng: 72.8331, phone: '+91-261-2456-9000', type: 'govt', category: 'general' },
    { name: 'Cure Hospital', lat: 21.1652, lng: 72.8281, phone: '+91-261-3988-9999', type: 'private', category: 'emergency' }
  ],

  'Lucknow, Uttar Pradesh': [
    { name: 'Medanta Hospital Lucknow', lat: 26.8883, lng: 80.8871, phone: '+91-522-3916-5000', type: 'private', category: 'emergency' },
    { name: 'Max Healthcare Lucknow', lat: 26.9097, lng: 80.9273, phone: '+91-522-4061-4001', type: 'private', category: 'emergency' },
    { name: 'Baba Raghav Das Medical College', lat: 26.7608, lng: 80.8908, phone: '+91-522-2257-8000', type: 'govt', category: 'general' },
    { name: 'King George Medical University', lat: 26.8406, lng: 80.9138, phone: '+91-522-2257-2000', type: 'govt', category: 'general' },
    { name: 'Fortis Hospital Lucknow', lat: 26.8883, lng: 80.8871, phone: '+91-522-2717-3000', type: 'private', category: 'emergency' }
  ]

  // Add more major districts as needed...
};

/**
 * Get hospitals for a district (fallback)
 * @param {string} district - District name
 * @returns {array} Hospitals in that district
 */
function getFallbackHospitals(district) {
  if (!district) return [];

  // Exact match
  if (FALLBACK_HOSPITALS[district]) {
    return FALLBACK_HOSPITALS[district];
  }

  // Fuzzy match (partial district name)
  const matches = Object.keys(FALLBACK_HOSPITALS).filter(d =>
    d.toLowerCase().includes(district.toLowerCase())
  );

  if (matches.length > 0) {
    return FALLBACK_HOSPITALS[matches[0]];
  }

  // Default: return first available (shouldn't happen in real use)
  return [];
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FALLBACK_HOSPITALS, getFallbackHospitals };
}
