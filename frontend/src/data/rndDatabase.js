// Mock Database for R&D Engineering - Hydrogen & Renewable Energy

// Research Papers Database
export const researchPapers = [
  {
    id: 'paper-1',
    title: 'Green Hydrogen Production via Alkaline Water Electrolysis: A Comprehensive Review',
    authors: ['Dr. Sarah Chen', 'Prof. Michael Weber', 'Dr. Yuki Tanaka'],
    institution: 'MIT Energy Initiative',
    country: 'USA',
    year: 2024,
    journal: 'Nature Energy',
    doi: '10.1038/s41560-024-01234-5',
    abstract: 'This comprehensive review examines the latest advancements in alkaline water electrolysis for green hydrogen production, analyzing efficiency improvements, cost reduction strategies, and scalability challenges.',
    keywords: ['green hydrogen', 'electrolysis', 'alkaline', 'renewable energy', 'water splitting'],
    citations: 156,
    category: 'Hydrogen Production',
    openAccess: true,
    pdfUrl: '#'
  },
  {
    id: 'paper-2',
    title: 'PEM Fuel Cell Catalyst Development: Platinum-Free Alternatives',
    authors: ['Prof. Hans Mueller', 'Dr. Anna Schmidt', 'Dr. Liu Wei'],
    institution: 'Fraunhofer Institute',
    country: 'Germany',
    year: 2024,
    journal: 'Advanced Energy Materials',
    doi: '10.1002/aenm.202401234',
    abstract: 'Investigation of non-precious metal catalysts for PEM fuel cells, focusing on iron-nitrogen-carbon materials with enhanced durability and activity.',
    keywords: ['PEM fuel cell', 'catalyst', 'platinum-free', 'Fe-N-C', 'electrochemistry'],
    citations: 89,
    category: 'Fuel Cells',
    openAccess: false,
    pdfUrl: '#'
  },
  {
    id: 'paper-3',
    title: 'Solid-State Hydrogen Storage in Metal Hydrides: Recent Progress and Challenges',
    authors: ['Dr. Kenji Yamamoto', 'Prof. Emily Johnson', 'Dr. Raj Patel'],
    institution: 'Toyota Research Institute',
    country: 'Japan',
    year: 2023,
    journal: 'Journal of Hydrogen Energy',
    doi: '10.1016/j.ijhydene.2023.12345',
    abstract: 'A detailed analysis of metal hydride systems for solid-state hydrogen storage, examining thermodynamic properties, kinetics, and practical applications in automotive sector.',
    keywords: ['hydrogen storage', 'metal hydrides', 'solid-state', 'magnesium hydride', 'automotive'],
    citations: 234,
    category: 'Hydrogen Storage',
    openAccess: true,
    pdfUrl: '#'
  },
  {
    id: 'paper-4',
    title: 'Offshore Wind-to-Hydrogen: Techno-Economic Assessment for Indonesia',
    authors: ['Dr. Budi Santoso', 'Prof. Ahmad Rizal', 'Dr. Sri Wahyuni'],
    institution: 'Institut Teknologi Bandung',
    country: 'Indonesia',
    year: 2024,
    journal: 'Renewable Energy',
    doi: '10.1016/j.renene.2024.56789',
    abstract: 'Comprehensive techno-economic analysis of offshore wind-powered hydrogen production in Indonesian archipelago, identifying optimal locations and investment requirements.',
    keywords: ['offshore wind', 'hydrogen', 'Indonesia', 'techno-economic', 'renewable'],
    citations: 45,
    category: 'Wind Energy',
    openAccess: true,
    pdfUrl: '#'
  },
  {
    id: 'paper-5',
    title: 'Perovskite Solar Cells for Direct Solar Hydrogen Generation',
    authors: ['Dr. Maria Garcia', 'Prof. John Smith', 'Dr. Park Ji-hoon'],
    institution: 'Stanford University',
    country: 'USA',
    year: 2024,
    journal: 'Science',
    doi: '10.1126/science.2024.abcd123',
    abstract: 'Novel tandem perovskite-silicon photoelectrochemical cells achieving record 25% solar-to-hydrogen efficiency through innovative interface engineering.',
    keywords: ['perovskite', 'solar', 'photoelectrochemical', 'tandem cell', 'STH efficiency'],
    citations: 312,
    category: 'Solar Energy',
    openAccess: false,
    pdfUrl: '#'
  },
  {
    id: 'paper-6',
    title: 'Biomass Gasification for Hydrogen Production: Process Optimization',
    authors: ['Prof. Lars Eriksson', 'Dr. Sofia Andersson'],
    institution: 'Chalmers University',
    country: 'Sweden',
    year: 2023,
    journal: 'Bioresource Technology',
    doi: '10.1016/j.biortech.2023.98765',
    abstract: 'Optimization of biomass gasification parameters for maximum hydrogen yield using machine learning approaches and experimental validation.',
    keywords: ['biomass', 'gasification', 'hydrogen', 'machine learning', 'optimization'],
    citations: 78,
    category: 'Biomass Energy',
    openAccess: true,
    pdfUrl: '#'
  },
  {
    id: 'paper-7',
    title: 'Underground Hydrogen Storage in Salt Caverns: Safety and Feasibility',
    authors: ['Dr. Pierre Dubois', 'Prof. Angela Merkel', 'Dr. James Wilson'],
    institution: 'TotalEnergies Research',
    country: 'France',
    year: 2024,
    journal: 'Applied Energy',
    doi: '10.1016/j.apenergy.2024.11111',
    abstract: 'Comprehensive safety assessment and feasibility study of large-scale hydrogen storage in geological salt caverns across European sites.',
    keywords: ['underground storage', 'salt cavern', 'hydrogen', 'safety', 'geological'],
    citations: 67,
    category: 'Hydrogen Storage',
    openAccess: false,
    pdfUrl: '#'
  },
  {
    id: 'paper-8',
    title: 'Green Ammonia Synthesis Using Renewable Hydrogen: Industrial Scale-up',
    authors: ['Dr. Kim Min-jun', 'Prof. David Brown', 'Dr. Fatima Al-Hassan'],
    institution: 'KAIST',
    country: 'South Korea',
    year: 2024,
    journal: 'Chemical Engineering Journal',
    doi: '10.1016/j.cej.2024.22222',
    abstract: 'Industrial-scale demonstration of green ammonia production using electrochemically generated hydrogen and novel ruthenium-based catalysts.',
    keywords: ['green ammonia', 'Haber-Bosch', 'renewable hydrogen', 'catalyst', 'industrial'],
    citations: 123,
    category: 'Hydrogen Applications',
    openAccess: true,
    pdfUrl: '#'
  }
];

// Laboratory Equipment Database
export const labEquipment = [
  {
    id: 'equip-1',
    name: 'PEM Electrolyzer Test Station',
    manufacturer: 'Greenlight Innovation',
    model: 'G500',
    category: 'Electrolysis',
    specifications: {
      power: '5 kW',
      pressure: 'Up to 30 bar',
      temperature: '20-80°C',
      efficiency: '>75%'
    },
    location: 'Lab A-101',
    status: 'Available',
    lastCalibration: '2024-06-15',
    nextMaintenance: '2025-01-15',
    priceRange: '$150,000 - $200,000',
    applications: ['PEM electrolysis testing', 'MEA characterization', 'Durability studies'],
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'
  },
  {
    id: 'equip-2',
    name: 'Gas Chromatograph with TCD/FID',
    manufacturer: 'Agilent Technologies',
    model: '8890 GC System',
    category: 'Analysis',
    specifications: {
      detectors: 'TCD + FID',
      carrier: 'Helium/Nitrogen',
      temperature: '-60 to 450°C',
      sensitivity: 'ppb level'
    },
    location: 'Lab B-203',
    status: 'In Use',
    lastCalibration: '2024-08-01',
    nextMaintenance: '2024-12-01',
    priceRange: '$80,000 - $120,000',
    applications: ['H2 purity analysis', 'Gas composition', 'Impurity detection'],
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400'
  },
  {
    id: 'equip-3',
    name: 'Potentiostat/Galvanostat',
    manufacturer: 'BioLogic',
    model: 'SP-300',
    category: 'Electrochemistry',
    specifications: {
      current: '±800 mA to ±10 A',
      voltage: '±12 V',
      impedance: '10 µHz to 7 MHz',
      channels: '8'
    },
    location: 'Lab A-105',
    status: 'Available',
    lastCalibration: '2024-07-20',
    nextMaintenance: '2025-02-20',
    priceRange: '$40,000 - $80,000',
    applications: ['CV measurements', 'EIS analysis', 'Battery testing', 'Fuel cell characterization'],
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400'
  },
  {
    id: 'equip-4',
    name: 'Solar Simulator',
    manufacturer: 'Newport/Oriel',
    model: 'Sol3A Class AAA',
    category: 'Solar Testing',
    specifications: {
      spectrum: 'AM 1.5G',
      illumination: '1000 W/m²',
      uniformity: '±2%',
      area: '15.6 x 15.6 cm'
    },
    location: 'Lab C-301',
    status: 'Available',
    lastCalibration: '2024-09-01',
    nextMaintenance: '2025-03-01',
    priceRange: '$60,000 - $100,000',
    applications: ['PV cell testing', 'Photoelectrochemical studies', 'Degradation analysis'],
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400'
  },
  {
    id: 'equip-5',
    name: 'Hydrogen Storage Test Chamber',
    manufacturer: 'Setaram',
    model: 'PCT Pro-2000',
    category: 'Storage Testing',
    specifications: {
      pressure: '0-200 bar',
      temperature: '-196 to 500°C',
      volume: '1-10 mL',
      accuracy: '±0.1%'
    },
    location: 'Lab A-102',
    status: 'Maintenance',
    lastCalibration: '2024-05-10',
    nextMaintenance: '2024-11-10',
    priceRange: '$200,000 - $300,000',
    applications: ['PCT measurements', 'Absorption kinetics', 'Cycling studies'],
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400'
  },
  {
    id: 'equip-6',
    name: 'Fuel Cell Test System',
    manufacturer: 'Scribner Associates',
    model: '850e',
    category: 'Fuel Cells',
    specifications: {
      power: '1 kW',
      current: '0-100 A',
      humidity: '0-100% RH',
      gases: 'H2, O2, Air, N2'
    },
    location: 'Lab A-103',
    status: 'In Use',
    lastCalibration: '2024-08-15',
    nextMaintenance: '2025-02-15',
    priceRange: '$250,000 - $400,000',
    applications: ['MEA testing', 'Stack evaluation', 'Durability cycling'],
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'
  },
  {
    id: 'equip-7',
    name: 'XRD Diffractometer',
    manufacturer: 'Bruker',
    model: 'D8 Advance',
    category: 'Material Analysis',
    specifications: {
      source: 'Cu Kα',
      range: '2θ: 0.5° - 168°',
      resolution: '0.0001°',
      detector: 'LYNXEYE XE-T'
    },
    location: 'Lab D-401',
    status: 'Available',
    lastCalibration: '2024-07-01',
    nextMaintenance: '2025-01-01',
    priceRange: '$300,000 - $500,000',
    applications: ['Crystal structure', 'Phase identification', 'Catalyst characterization'],
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400'
  },
  {
    id: 'equip-8',
    name: 'Wind Tunnel - Subsonic',
    manufacturer: 'Aerolab',
    model: 'Educational Wind Tunnel',
    category: 'Aerodynamics',
    specifications: {
      speed: '0-50 m/s',
      testSection: '30 x 30 cm',
      turbulence: '<0.5%',
      power: '15 kW'
    },
    location: 'Lab E-501',
    status: 'Available',
    lastCalibration: '2024-06-01',
    nextMaintenance: '2024-12-01',
    priceRange: '$100,000 - $200,000',
    applications: ['Blade design', 'Turbine optimization', 'Flow visualization'],
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400'
  }
];

// Materials/Chemicals Database
export const materials = [
  {
    id: 'mat-1',
    name: 'Platinum on Carbon (Pt/C)',
    casNumber: '7440-06-4',
    category: 'Catalyst',
    formula: 'Pt/C',
    purity: '20-60 wt% Pt',
    supplier: 'Johnson Matthey',
    specifications: {
      particleSize: '2-5 nm',
      surfaceArea: '50-100 m²/g',
      loading: '20%, 40%, 60%'
    },
    applications: ['PEM fuel cells', 'Electrolysis', 'Hydrogenation'],
    hazards: ['Flammable', 'Respiratory irritant'],
    storage: 'Cool, dry place, inert atmosphere',
    priceRange: '$500-2000/g',
    stock: 25,
    unit: 'grams',
    msdsUrl: '#'
  },
  {
    id: 'mat-2',
    name: 'Nafion™ Membrane (N117)',
    casNumber: '31175-20-9',
    category: 'Membrane',
    formula: 'PFSA',
    purity: 'N/A',
    supplier: 'Chemours',
    specifications: {
      thickness: '183 µm',
      conductivity: '0.1 S/cm',
      EW: '1100 g/eq'
    },
    applications: ['PEM fuel cells', 'Electrolyzers', 'Sensors'],
    hazards: ['Eye irritant'],
    storage: 'Room temperature, humidity controlled',
    priceRange: '$200-500/sheet',
    stock: 50,
    unit: 'sheets',
    msdsUrl: '#'
  },
  {
    id: 'mat-3',
    name: 'Magnesium Hydride (MgH2)',
    casNumber: '7693-27-8',
    category: 'Hydride',
    formula: 'MgH₂',
    purity: '98%',
    supplier: 'Sigma-Aldrich',
    specifications: {
      capacity: '7.6 wt% H2',
      density: '1.45 g/cm³',
      desorption: '300-400°C'
    },
    applications: ['Hydrogen storage', 'Reducing agent', 'Energy storage'],
    hazards: ['Flammable', 'Water reactive', 'Self-heating'],
    storage: 'Inert atmosphere, dry, <25°C',
    priceRange: '$100-300/100g',
    stock: 500,
    unit: 'grams',
    msdsUrl: '#'
  },
  {
    id: 'mat-4',
    name: 'Iridium Oxide (IrO2)',
    casNumber: '12030-49-8',
    category: 'Catalyst',
    formula: 'IrO₂',
    purity: '99.9%',
    supplier: 'Alfa Aesar',
    specifications: {
      particleSize: '< 100 nm',
      surfaceArea: '30-50 m²/g',
      conductivity: '10⁴ S/m'
    },
    applications: ['OER catalyst', 'PEM electrolysis', 'Electrodes'],
    hazards: ['Respiratory irritant'],
    storage: 'Cool, dry place',
    priceRange: '$1000-3000/g',
    stock: 10,
    unit: 'grams',
    msdsUrl: '#'
  },
  {
    id: 'mat-5',
    name: 'Carbon Cloth (GDL)',
    casNumber: 'N/A',
    category: 'Substrate',
    formula: 'C',
    purity: '>99% C',
    supplier: 'AvCarb',
    specifications: {
      thickness: '200-400 µm',
      porosity: '70-80%',
      resistivity: '< 10 mΩ·cm'
    },
    applications: ['Fuel cell GDL', 'Electrode substrate', 'Filtration'],
    hazards: ['Dust irritant'],
    storage: 'Dry, avoid contamination',
    priceRange: '$50-150/m²',
    stock: 100,
    unit: 'm²',
    msdsUrl: '#'
  },
  {
    id: 'mat-6',
    name: 'Titanium Felt',
    casNumber: '7440-32-6',
    category: 'Substrate',
    formula: 'Ti',
    purity: '99.5%',
    supplier: 'Bekaert',
    specifications: {
      thickness: '0.2-1.0 mm',
      porosity: '60-75%',
      fiberDia: '20 µm'
    },
    applications: ['PEM electrolyzer PTL', 'Current collector', 'Filtration'],
    hazards: ['Flammable as powder'],
    storage: 'Dry, clean environment',
    priceRange: '$200-600/sheet',
    stock: 30,
    unit: 'sheets',
    msdsUrl: '#'
  },
  {
    id: 'mat-7',
    name: 'Potassium Hydroxide (KOH)',
    casNumber: '1310-58-3',
    category: 'Electrolyte',
    formula: 'KOH',
    purity: '≥85%',
    supplier: 'Merck',
    specifications: {
      form: 'Pellets/Flakes',
      molarMass: '56.11 g/mol',
      density: '2.12 g/cm³'
    },
    applications: ['Alkaline electrolysis', 'Battery electrolyte', 'pH adjustment'],
    hazards: ['Corrosive', 'Skin burns', 'Eye damage'],
    storage: 'Airtight container, dry',
    priceRange: '$30-80/kg',
    stock: 50,
    unit: 'kg',
    msdsUrl: '#'
  },
  {
    id: 'mat-8',
    name: 'Nickel Foam',
    casNumber: '7440-02-0',
    category: 'Substrate',
    formula: 'Ni',
    purity: '99.8%',
    supplier: 'MTI Corp',
    specifications: {
      thickness: '1.6 mm',
      porosity: '95-98%',
      ppi: '80-110'
    },
    applications: ['Electrode substrate', 'Current collector', 'Catalyst support'],
    hazards: ['Carcinogenic potential', 'Skin sensitizer'],
    storage: 'Dry, avoid oxidation',
    priceRange: '$20-50/sheet',
    stock: 200,
    unit: 'sheets',
    msdsUrl: '#'
  }
];

// Research Institutions Database
export const institutions = [
  {
    id: 'inst-1',
    name: 'National Renewable Energy Laboratory (NREL)',
    type: 'Government Lab',
    country: 'USA',
    city: 'Golden, Colorado',
    focus: ['Solar', 'Hydrogen', 'Wind', 'Bioenergy'],
    facilities: ['Hydrogen Testing Facility', 'Solar Energy Research Facility', 'Wind Technology Center'],
    employees: 2800,
    budget: '$500M+',
    website: 'https://www.nrel.gov',
    contact: 'info@nrel.gov',
    publications: 1500,
    collaborations: ['MIT', 'Stanford', 'KAIST'],
    logo: 'https://www.nrel.gov/assets/images/nrel-logo.png'
  },
  {
    id: 'inst-2',
    name: 'Fraunhofer Institute for Solar Energy Systems (ISE)',
    type: 'Research Institute',
    country: 'Germany',
    city: 'Freiburg',
    focus: ['Solar PV', 'Hydrogen', 'Energy Storage', 'Building Energy'],
    facilities: ['PV-TEC', 'Hydrogen Lab', 'CalLab PV Cells'],
    employees: 1400,
    budget: '€100M+',
    website: 'https://www.ise.fraunhofer.de',
    contact: 'info@ise.fraunhofer.de',
    publications: 800,
    collaborations: ['TU Munich', 'KIT', 'EPFL'],
    logo: 'https://www.fraunhofer.de/logo.png'
  },
  {
    id: 'inst-3',
    name: 'Institut Teknologi Bandung (ITB)',
    type: 'University',
    country: 'Indonesia',
    city: 'Bandung',
    focus: ['Geothermal', 'Hydrogen', 'Biomass', 'Solar'],
    facilities: ['New & Renewable Energy Lab', 'Hydrogen Research Center', 'Material Science Lab'],
    employees: 500,
    budget: '$20M',
    website: 'https://www.itb.ac.id',
    contact: 'humas@itb.ac.id',
    publications: 200,
    collaborations: ['UI', 'UGM', 'BRIN'],
    logo: 'https://www.itb.ac.id/logo.png'
  },
  {
    id: 'inst-4',
    name: 'Korea Institute of Energy Research (KIER)',
    type: 'Government Lab',
    country: 'South Korea',
    city: 'Daejeon',
    focus: ['Hydrogen', 'Fuel Cells', 'Solar', 'Energy Efficiency'],
    facilities: ['Hydrogen Town', 'Fuel Cell Center', 'Solar Cell Lab'],
    employees: 900,
    budget: '$150M',
    website: 'https://www.kier.re.kr',
    contact: 'webmaster@kier.re.kr',
    publications: 600,
    collaborations: ['KAIST', 'POSTECH', 'Hyundai'],
    logo: 'https://www.kier.re.kr/logo.png'
  },
  {
    id: 'inst-5',
    name: 'Toyota Research Institute',
    type: 'Corporate R&D',
    country: 'Japan',
    city: 'Toyota City',
    focus: ['Fuel Cells', 'Hydrogen Storage', 'EV Batteries', 'AI'],
    facilities: ['Mirai Development Center', 'Hydrogen Station Network', 'Battery Lab'],
    employees: 1200,
    budget: '$400M',
    website: 'https://www.tri.global',
    contact: 'info@tri.global',
    publications: 350,
    collaborations: ['Stanford', 'MIT', 'University of Tokyo'],
    logo: 'https://www.toyota.com/logo.png'
  },
  {
    id: 'inst-6',
    name: 'BRIN - National Research and Innovation Agency',
    type: 'Government Lab',
    country: 'Indonesia',
    city: 'Jakarta',
    focus: ['Energy', 'Materials', 'Biotechnology', 'Nuclear'],
    facilities: ['PUSPIPTEK', 'Nuclear Research Center', 'Materials Lab'],
    employees: 10000,
    budget: '$200M',
    website: 'https://www.brin.go.id',
    contact: 'info@brin.go.id',
    publications: 500,
    collaborations: ['ITB', 'UI', 'UGM', 'International Partners'],
    logo: 'https://www.brin.go.id/logo.png'
  },
  {
    id: 'inst-7',
    name: 'Helmholtz-Zentrum Berlin',
    type: 'Research Institute',
    country: 'Germany',
    city: 'Berlin',
    focus: ['Solar Fuels', 'Thin Film PV', 'Energy Materials', 'Catalysis'],
    facilities: ['BESSY II Synchrotron', 'Solar Fuels Facility', 'HySPRINT'],
    employees: 1100,
    budget: '€120M',
    website: 'https://www.helmholtz-berlin.de',
    contact: 'info@helmholtz-berlin.de',
    publications: 700,
    collaborations: ['Fraunhofer ISE', 'TU Berlin', 'EPFL'],
    logo: 'https://www.helmholtz-berlin.de/logo.png'
  },
  {
    id: 'inst-8',
    name: 'Tsinghua University - Institute of Nuclear and New Energy Technology',
    type: 'University',
    country: 'China',
    city: 'Beijing',
    focus: ['Nuclear Hydrogen', 'HTR', 'Hydrogen Production', 'Energy Systems'],
    facilities: ['HTR-PM', 'Hydrogen Production Facility', 'Advanced Reactor Lab'],
    employees: 800,
    budget: '$100M',
    website: 'https://www.inet.tsinghua.edu.cn',
    contact: 'inet@tsinghua.edu.cn',
    publications: 900,
    collaborations: ['MIT', 'Idaho National Lab', 'KAERI'],
    logo: 'https://www.tsinghua.edu.cn/logo.png'
  }
];

// Categories for filtering
export const categories = {
  papers: ['Hydrogen Production', 'Hydrogen Storage', 'Fuel Cells', 'Solar Energy', 'Wind Energy', 'Biomass Energy', 'Hydrogen Applications', 'Energy Policy'],
  equipment: ['Electrolysis', 'Analysis', 'Electrochemistry', 'Solar Testing', 'Storage Testing', 'Fuel Cells', 'Material Analysis', 'Aerodynamics'],
  materials: ['Catalyst', 'Membrane', 'Hydride', 'Substrate', 'Electrolyte', 'Gas', 'Polymer', 'Metal'],
  institutions: ['University', 'Government Lab', 'Research Institute', 'Corporate R&D']
};

export const countries = [
  'USA', 'Germany', 'Japan', 'South Korea', 'China', 'Indonesia', 'Sweden', 'France', 'UK', 'Australia', 'Netherlands', 'India'
];
