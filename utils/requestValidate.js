export const checkFields = (fields) => {
    return (req, res, next) => {
        console.log(req.body)
        for (const field of fields) {
            if (typeof req.body[field] == 'boolean') {
                if (req.body[field] == null) {
                    return res.status(400).json({ message: `${field} is required` });
                }
            } else {
                if (!req.body[field]) {
                    return res.status(400).json({ message: `${field} is required` });
                }
            }
        }
        next();
    };
}