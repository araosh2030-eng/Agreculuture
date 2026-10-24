from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import database, models, schemas

router = APIRouter(prefix="/api/community", tags=["Community Feed"])

@router.get("/posts", response_model=List[schemas.CommunityPostResponse])
def get_community_posts(db: Session = Depends(database.get_db)):
    return db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()

@router.post("/posts", response_model=schemas.CommunityPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post_in: schemas.CommunityPostCreate, db: Session = Depends(database.get_db)):
    new_post = models.CommunityPost(
        content=post_in.content,
        author_name=post_in.author_name or "عضو جديد"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.post("/posts/{post_id}/like", response_model=schemas.CommunityPostResponse)
def like_post(post_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="المنشور غير موجود")
    post.likes += 1
    db.commit()
    db.refresh(post)
    return post
