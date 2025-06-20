
import { Request, Response, NextFunction } from 'express'; 
import { AppError } from '../../middleware/error.middleware'; 
import { getNextLearningCourses } from '../../services/dashboard'; 
import { errorResponse, successResponse } from '../../utils/api.utils'; 
import { DashboradCourseDTO } from 'types/course.types'; 

/** 
 * GET /next-learning 
 * Returns the "What to learn next?" courses 
 */ 
export async function nextLearningController( 
  req: Request, 
  res: Response, 
  next: NextFunction 
) { 
  try { 
    const userId = req.user?.id; 
    if (!userId) { 
        throw new AppError(401, 'User not authenticated'); 
    } 
    
    const data = await getNextLearningCourses(userId);
    
    // Ensure data is an array before mapping
    const courses = Array.isArray(data) ? data : [];
    
    const payload: DashboradCourseDTO[] = courses.map((c) => ({ 
        id: c.id, 
        title: c.title, 
        thumbnail: c.thumbnail_url, 
        difficulty: c.difficulty, 
        duration: c.total_duration, 
        slug: c.slug, 
        instructorName: c?.user?.full_name || 'Unknown', 
        isInWishList: c.wishlists?.length > 0, 
      })); 
    
    successResponse(res, payload); 
  } catch (err) { 
    if (err instanceof AppError) {
         errorResponse(res, err.message, err.statusCode, err.errors);
       } else {
         errorResponse(res, "Internal server error");
       }
  } 
}