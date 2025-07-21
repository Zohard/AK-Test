# Anime-Kun Modern Web Application

A modern, responsive web application for anime and manga enthusiasts, built with React and Node.js. Features include a carousel showcase of recent animes, critique system, and comprehensive database of anime/manga information.

## 🌟 Features

- **Interactive Hero Carousel**: Showcases 5 most recent animes with auto-rotation
- **Light/Dark Mode**: Toggle between themes with persistent preference
- **Critique System**: Display and browse user reviews with ratings
- **Responsive Design**: Mobile-first approach with modern UI
- **Real-time Search**: Search across anime and manga database
- **RESTful API**: Clean API with pagination and filtering
- **Modern Stack**: React 18, Node.js, Express, MySQL

## 📸 Screenshots

- Hero carousel with recent anime releases
- Article cards showing critiques with ratings
- Clean navigation with theme switching
- Mobile-responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:Zohard/AK-Test.git
   cd AK-Test
   ```

2. **Set up the database**
   ```bash
   # Import the database schema
   mysql -u root -p < schema.sql
   ```

3. **Configure the API**
   ```bash
   cd api
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   ```

4. **Configure the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Add images (optional)**
   ```bash
   # Place your anime/manga images in frontend/public/images/
   # Images should match the filenames in your database
   ```

## 🔧 Configuration

### API Environment Variables

Copy `api/.env.example` to `api/.env` and configure:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3001
```

### Database Schema

The application expects these main tables:
- `ak_animes` - Anime information
- `ak_mangas` - Manga information  
- `ak_critique` - User reviews and critiques
- `ak_users` - User accounts
- `ak_business*` - Studio/publisher relationships

See `schema.sql` for the complete database structure.

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the API server**
   ```bash
   cd api
   npm start
   # API runs on http://localhost:3000
   ```

2. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm start
   # Frontend runs on http://localhost:3001
   ```

### Production Mode

```bash
# Build the frontend
cd frontend
npm run build

# Start the API server
cd ../api
NODE_ENV=production npm start
```

## 📁 Project Structure

```
anime-kun/
├── api/                    # Backend API
│   ├── server.js          # Express server
│   ├── package.json       # API dependencies
│   ├── .env.example       # Environment template
│   └── .env               # Environment config (not in git)
├── frontend/              # React frontend
│   ├── public/           # Static files
│   │   ├── images/       # Anime/manga images (not in git)
│   │   └── index.html    # HTML template
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (theme)
│   │   ├── styles/       # CSS styles
│   │   └── App.js        # Main app component
│   └── package.json      # Frontend dependencies
├── schema.sql            # Database schema
├── docker-compose.yml    # Docker configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🎨 Key Components

### Frontend Components

- **HeroBanner.js**: Carousel showcasing recent animes
- **Header.js**: Navigation with theme toggle
- **ArticleCard.js**: Critique display cards
- **ThemeContext.js**: Light/dark mode management

### API Endpoints

- `GET /api/animes` - List animes (supports `?recent=true`)
- `GET /api/mangas` - List mangas
- `GET /api/critiques` - List critiques with anime/manga info
- `GET /api/search` - Search across content
- `GET /api/anime-business` - Studio relationships
- `GET /metrics` - Prometheus metrics

## 🛠️ Technologies Used

### Frontend
- React 18 with Hooks
- React Router v6
- Axios for API calls
- CSS3 with custom properties
- Responsive design

### Backend
- Node.js with Express
- MySQL2 with connection pooling
- CORS enabled
- Prometheus metrics
- Node-cache for performance

### Development
- Environment variable configuration
- Hot reload development
- ESLint for code quality

## 📊 API Features

- **Pagination**: All endpoints support `page` and `limit` parameters
- **Filtering**: Recent animes, status filtering, search
- **Performance**: Connection pooling, caching, metrics
- **Security**: Environment-based configuration, CORS

## 🔍 Search Functionality

The application includes search capabilities across:
- Anime titles and synopses
- Manga titles and synopses
- Fuzzy matching support
- Type-specific filtering

## 🌙 Theme System

- Persistent theme preference (localStorage)
- CSS custom properties for theming
- Smooth transitions between themes
- System preference detection

## 📱 Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly navigation
- Optimized carousel for mobile

## 🐳 Docker Support

```bash
# Build and run with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost
# API: http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Anime and manga data structure inspired by classic anime databases
- UI/UX design following modern web standards
- Community-driven content and reviews

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Note**: This project is for educational and demonstration purposes. Make sure to configure your own database and add appropriate content following copyright guidelines.