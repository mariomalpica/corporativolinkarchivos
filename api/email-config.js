// Vercel Serverless Function para configuración de email
let emailConfig = {
  email: process.env.EMAIL_USER || 'corporativolinkarchivos@gmail.com',
  password: process.env.EMAIL_PASS || 'M1q2w3e4r5t6y7u8i($'
};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son requeridos' 
      });
    }
    
    emailConfig = { email, password };
    
    return res.json({ 
      success: true, 
      message: 'Configuración de email actualizada' 
    });
  }

  if (req.method === 'GET') {
    return res.json({
      email: emailConfig.email,
      // No devolver la contraseña por seguridad
      hasPassword: !!emailConfig.password
    });
  }

  res.status(405).json({ message: 'Método no permitido' });
}