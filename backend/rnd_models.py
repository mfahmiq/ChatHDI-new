"""
R&D Database models and initial data
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid


# ============ MODELS ============

class ResearchPaper(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    authors: List[str]
    institution: str
    journal: str
    year: int
    doi: str
    abstract: str
    keywords: List[str]
    citations: int
    category: str
    country: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LabEquipment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    manufacturer: str
    model: str
    category: str
    location: str
    status: str  # Available, In Use, Maintenance
    specifications: Dict[str, str]
    applications: List[str]
    priceRange: str
    country: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    formula: str
    casNumber: str
    purity: str
    supplier: str
    stock: float
    unit: str
    category: str
    specifications: Dict[str, str]
    hazards: List[str]
    priceRange: str
    country: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Institution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    city: str
    country: str
    employees: int
    budget: str
    focus: List[str]
    facilities: List[str]
    publications: int
    website: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============ INITIAL DATA ============

INITIAL_PAPERS = [
    {
        "id": "paper-1",
        "title": "Green Hydrogen Production via Alkaline Water Electrolysis: A Comprehensive Review",
        "authors": ["Dr. Sarah Chen", "Prof. Michael Weber", "et al."],
        "institution": "MIT Energy Initiative",
        "journal": "Nature Energy",
        "year": 2024,
        "doi": "10.1038/s41560-024-001234",
        "abstract": "This comprehensive review examines recent advances in alkaline water electrolysis for green hydrogen production...",
        "keywords": ["hydrogen", "electrolysis", "alkaline", "renewable energy"],
        "citations": 156,
        "category": "Hydrogen Production",
        "country": "USA"
    },
    {
        "id": "paper-2",
        "title": "PEM Fuel Cell Catalyst Development: Platinum-Free Alternatives",
        "authors": ["Prof. Hans Mueller", "Dr. Anna Schmidt", "et al."],
        "institution": "Fraunhofer Institute",
        "journal": "Advanced Materials",
        "year": 2024,
        "doi": "10.1002/adma.202401234",
        "abstract": "Development of cost-effective platinum-free catalysts for PEM fuel cells...",
        "keywords": ["fuel cell", "catalyst", "PEM", "platinum-free"],
        "citations": 89,
        "category": "Fuel Cells",
        "country": "Germany"
    },
    {
        "id": "paper-3",
        "title": "Solid-State Hydrogen Storage in Metal Hydrides: Recent Progress and Challenges",
        "authors": ["Dr. Kenji Yamamoto", "Prof. Emily Johnson", "et al."],
        "institution": "Tokyo University",
        "journal": "Journal of Hydrogen Energy",
        "year": 2023,
        "doi": "10.1016/j.ijhydene.2023.12345",
        "abstract": "Review of metal hydride materials for solid-state hydrogen storage applications...",
        "keywords": ["hydrogen storage", "metal hydride", "solid-state"],
        "citations": 234,
        "category": "Hydrogen Storage",
        "country": "Japan"
    },
    {
        "id": "paper-4",
        "title": "Offshore Wind-to-Hydrogen: Techno-Economic Assessment for Indonesia",
        "authors": ["Dr. Budi Santoso", "Prof. Ahmad Rizal", "et al."],
        "institution": "ITB",
        "journal": "Renewable Energy",
        "year": 2024,
        "doi": "10.1016/j.renene.2024.56789",
        "abstract": "Economic feasibility study of offshore wind coupled with hydrogen production in Indonesia...",
        "keywords": ["offshore wind", "hydrogen", "Indonesia", "techno-economic"],
        "citations": 45,
        "category": "Wind Energy",
        "country": "Indonesia"
    },
    {
        "id": "paper-5",
        "title": "Perovskite Solar Cells for Direct Solar Hydrogen Generation",
        "authors": ["Dr. Maria Garcia", "Prof. John Smith", "et al."],
        "institution": "Stanford University",
        "journal": "Science",
        "year": 2024,
        "doi": "10.1126/science.2024.abcd",
        "abstract": "Novel perovskite-based photoelectrochemical cells for efficient solar hydrogen production...",
        "keywords": ["perovskite", "solar", "hydrogen", "PEC"],
        "citations": 312,
        "category": "Solar Energy",
        "country": "USA"
    },
    {
        "id": "paper-6",
        "title": "Biomass Gasification for Hydrogen Production: Process Optimization",
        "authors": ["Prof. Lars Eriksson", "Dr. Sofia Andersson"],
        "institution": "KTH Royal Institute",
        "journal": "Bioresource Technology",
        "year": 2023,
        "doi": "10.1016/j.biortech.2023.67890",
        "abstract": "Optimization strategies for biomass gasification processes to maximize hydrogen yield...",
        "keywords": ["biomass", "gasification", "hydrogen", "optimization"],
        "citations": 78,
        "category": "Biomass Energy",
        "country": "Sweden"
    }
]

INITIAL_EQUIPMENT = [
    {
        "id": "equip-1",
        "name": "PEM Electrolyzer System",
        "manufacturer": "Siemens",
        "model": "Silyzer 300",
        "category": "Electrolyzer",
        "location": "Lab A - Building 1",
        "status": "Available",
        "specifications": {
            "capacity": "10 MW",
            "efficiency": "75%",
            "pressure": "30 bar"
        },
        "applications": ["Green hydrogen production", "Power-to-gas", "Energy storage"],
        "priceRange": "$2-5 Million",
        "country": "Germany"
    },
    {
        "id": "equip-2",
        "name": "Gas Chromatograph Mass Spectrometer",
        "manufacturer": "Agilent",
        "model": "7890B/5977B",
        "category": "Analytical",
        "location": "Lab B - Building 2",
        "status": "In Use",
        "specifications": {
            "mass_range": "1.6-1050 amu",
            "sensitivity": "1 pg OFN",
            "scan_speed": "20,000 amu/s"
        },
        "applications": ["Gas analysis", "Purity testing", "Contamination detection"],
        "priceRange": "$150-300k",
        "country": "USA"
    },
    {
        "id": "equip-3",
        "name": "Fuel Cell Test Station",
        "manufacturer": "Greenlight Innovation",
        "model": "G60",
        "category": "Testing",
        "location": "Lab C - Building 1",
        "status": "Available",
        "specifications": {
            "power": "6 kW",
            "temperature": "up to 200°C",
            "humidity": "0-100% RH"
        },
        "applications": ["PEM fuel cell testing", "SOFC testing", "Stack characterization"],
        "priceRange": "$200-400k",
        "country": "Canada"
    }
]

INITIAL_MATERIALS = [
    {
        "id": "mat-1",
        "name": "Platinum on Carbon",
        "formula": "Pt/C",
        "casNumber": "7440-06-4",
        "purity": "40% Pt",
        "supplier": "Johnson Matthey",
        "stock": 500,
        "unit": "g",
        "category": "Catalyst",
        "specifications": {
            "surface_area": "800 m²/g",
            "particle_size": "2-3 nm"
        },
        "hazards": ["Flammable", "Irritant"],
        "priceRange": "$50-100/g",
        "country": "UK"
    },
    {
        "id": "mat-2",
        "name": "Nafion Membrane",
        "formula": "C7HF13O5S·C2F4",
        "casNumber": "31175-20-9",
        "purity": "99%",
        "supplier": "Chemours",
        "stock": 100,
        "unit": "m²",
        "category": "Membrane",
        "specifications": {
            "thickness": "50-183 µm",
            "conductivity": ">0.1 S/cm"
        },
        "hazards": ["Irritant"],
        "priceRange": "$500-1000/m²",
        "country": "USA"
    },
    {
        "id": "mat-3",
        "name": "Magnesium Hydride",
        "formula": "MgH2",
        "casNumber": "7693-27-8",
        "purity": "98%",
        "supplier": "Sigma-Aldrich",
        "stock": 2000,
        "unit": "g",
        "category": "Storage Material",
        "specifications": {
            "h2_capacity": "7.6 wt%",
            "density": "1.45 g/cm³"
        },
        "hazards": ["Flammable", "Water-reactive"],
        "priceRange": "$100-200/kg",
        "country": "Germany"
    }
]

INITIAL_INSTITUTIONS = [
    {
        "id": "inst-1",
        "name": "National Renewable Energy Laboratory (NREL)",
        "type": "Government Lab",
        "city": "Golden, Colorado",
        "country": "USA",
        "employees": 3000,
        "budget": "$500M+",
        "focus": ["Solar", "Wind", "Hydrogen", "Bioenergy"],
        "facilities": ["Hydrogen Testing Lab", "Solar Energy Research Facility", "Wind Technology Center"],
        "publications": 5000,
        "website": "https://www.nrel.gov"
    },
    {
        "id": "inst-2",
        "name": "Fraunhofer Institute for Solar Energy Systems",
        "type": "Research Institute",
        "city": "Freiburg",
        "country": "Germany",
        "employees": 1400,
        "budget": "€100M+",
        "focus": ["Solar PV", "Hydrogen", "Energy Storage", "Building Energy"],
        "facilities": ["CalLab PV Cells", "Hydrogen Lab", "Battery Lab"],
        "publications": 3000,
        "website": "https://www.ise.fraunhofer.de"
    },
    {
        "id": "inst-3",
        "name": "Institut Teknologi Bandung (ITB)",
        "type": "University",
        "city": "Bandung",
        "country": "Indonesia",
        "employees": 5000,
        "budget": "Rp 2T+",
        "focus": ["Geothermal", "Hydrogen", "Renewable Energy", "Materials Science"],
        "facilities": ["Energy Conversion Lab", "Materials Research Center", "Renewable Energy Lab"],
        "publications": 2000,
        "website": "https://www.itb.ac.id"
    }
]

CATEGORIES = {
    "papers": ["Hydrogen Production", "Hydrogen Storage", "Fuel Cells", "Solar Energy", "Wind Energy", "Biomass Energy", "Geothermal"],
    "equipment": ["Electrolyzer", "Analytical", "Testing", "Production", "Safety"],
    "materials": ["Catalyst", "Membrane", "Storage Material", "Electrode", "Electrolyte"],
    "institutions": ["University", "Government Lab", "Research Institute", "Private Company"]
}

COUNTRIES = ["USA", "Germany", "Japan", "UK", "Indonesia", "China", "South Korea", "Australia", "Canada", "Sweden", "Netherlands"]
