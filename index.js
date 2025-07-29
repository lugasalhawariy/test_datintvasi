import express from 'express';
import cors from 'cors'

import authRouter from './router/auth.routes.js'
import menuRouter from './router/menu.routes.js'
import roleRouter from './router/role.routes.js'

const app = express();

app.use(express.json());
app.use(cors());

app.use('/auth', authRouter);
app.use('/menu', menuRouter);
app.use('/role', roleRouter);

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

export default app;