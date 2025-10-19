# Contributing to ASL Teacher

Thank you for your interest in contributing to ASL Teacher!

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Docker version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please open an issue with:
- A clear description of the feature
- Why it would be useful
- Any implementation ideas

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

### Code Style

- Use consistent indentation (2 spaces for JavaScript)
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small

### Testing

- Test your changes with both Learn and Test modes
- Verify camera functionality
- Check API endpoints with different inputs
- Test with and without user registration

### Documentation

- Update README.md if adding new features
- Add JSDoc comments for new functions
- Update API documentation for new endpoints

## Project Structure

```
asl-teacher-single-container/
├── backend/              # Node.js/Express API
│   ├── db.js            # Database connection and schema
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
├── frontend/            # React application
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/       # Utility functions
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
├── Dockerfile           # Container definition
├── docker-compose.yml   # Docker Compose config
├── supervisord.conf     # Process manager config
├── nginx.conf           # Web server config
└── init-postgres.sh     # Database initialization
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing!
