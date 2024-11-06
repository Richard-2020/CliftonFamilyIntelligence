# from youtube_transcript_api import YouTubeTranscriptApi
# from googleapiclient.discovery import build
# import os
# from typing import List, Dict, Optional
# from utils import sanitize_text
# import time

# class YouTubeScraper:
#     def __init__(self, api_key: str):
#         self.youtube = build('youtube', 'v3', developerKey=api_key)
#         self.transcripts_dir = 'transcripts'
#         os.makedirs(self.transcripts_dir, exist_ok=True)
#         # YouTube API quota cost per search.list request
#         self.SEARCH_QUOTA_COST = 100
#         # Default quota limit per day
#         self.DAILY_QUOTA_LIMIT = 10000
        
#     def get_channel_id(self, channel_name: str) -> str:
#         """Get channel ID from channel name."""
#         try:
#             request = self.youtube.search().list(
#                 part="snippet",
#                 type="channel",
#                 q=channel_name,
#                 maxResults=1
#             )
#             response = request.execute()
            
#             if 'items' in response and response['items']:
#                 return response['items'][0]['snippet']['channelId']
#             raise ValueError(f"Channel '{channel_name}' not found")
#         except Exception as e:
#             raise Exception(f"Error getting channel ID: {str(e)}")

#     def get_total_videos(self, channel_id: str) -> int:
#         """Get total number of videos in a channel."""
#         try:
#             request = self.youtube.channels().list(
#                 part="statistics",
#                 id=channel_id
#             )
#             response = request.execute()
#             return int(response['items'][0]['statistics']['videoCount'])
#         except Exception as e:
#             raise Exception(f"Error getting video count: {str(e)}")

#     def get_channel_videos(self, channel_id: str, max_results: int = None) -> List[Dict]:
#         """Get all videos from channel with pagination and quota management."""
#         videos = []
#         next_page_token = None
#         quota_used = 0
        
#         try:
#             # Get total videos if max_results not specified
#             if max_results is None:
#                 total_videos = self.get_total_videos(channel_id)
#             else:
#                 total_videos = max_results

#             while True:
#                 # Check if we've reached the desired number of videos
#                 if max_results and len(videos) >= max_results:
#                     break
                
#                 # Check quota usage
#                 if quota_used + self.SEARCH_QUOTA_COST > self.DAILY_QUOTA_LIMIT:
#                     print("Daily quota limit approaching. Waiting for reset...")
#                     time.sleep(24 * 3600)  # Wait 24 hours
#                     quota_used = 0

#                 request = self.youtube.search().list(
#                     part='id,snippet',
#                     channelId=channel_id,
#                     maxResults=50,  # Maximum allowed by API
#                     type='video',
#                     order='date',
#                     pageToken=next_page_token
#                 )
#                 response = request.execute()
#                 quota_used += self.SEARCH_QUOTA_COST
                
#                 for item in response['items']:
#                     video_data = {
#                         'id': item['id']['videoId'],
#                         'title': item['snippet']['title'],
#                         'description': item['snippet']['description'],
#                         'published_at': item['snippet']['publishedAt']
#                     }
#                     videos.append(video_data)
                    
#                     # Check if we've reached the desired number of videos
#                     if max_results and len(videos) >= max_results:
#                         break
                
#                 # Handle pagination
#                 next_page_token = response.get('nextPageToken')
#                 if not next_page_token:
#                     break
                    
#                 # Add delay to avoid rate limiting
#                 time.sleep(0.5)
                
#                 # Progress update
#                 print(f"Fetched {len(videos)}/{total_videos} videos...")
            
#             return videos
#         except Exception as e:
#             raise Exception(f"Error getting channel videos: {str(e)}")

#     def get_transcript(self, video_id: str) -> Optional[str]:
#         """Get transcript for a video."""
#         try:
#             transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
#             transcript_text = ' '.join([entry['text'] for entry in transcript_list])
#             return sanitize_text(transcript_text)
#         except Exception as e:
#             print(f"Error fetching transcript for video {video_id}: {str(e)}")
#             return None

#     def save_transcript(self, channel_name: str, videos: List[Dict]) -> str:
#         """Save transcripts to file and return combined transcript text."""
#         filename = os.path.join(self.transcripts_dir, f"{sanitize_text(channel_name)}_transcripts.txt")
#         combined_transcript = ""
        
#         total_videos = len(videos)
        
#         with open(filename, 'w', encoding='utf-8') as f:
#             for i, video in enumerate(videos, 1):
#                 print(f"Processing transcript {i}/{total_videos}: {video['title']}")
#                 transcript = self.get_transcript(video['id'])
#                 content = f"""
#                 Video: {video['title']}
#                 ID: {video['id']}
#                 Published: {video['published_at']}
                
#                 Transcript:
#                 {transcript if transcript else 'No transcript available.'}
                
#                 {'=' * 50}
                
#                 """
#                 f.write(content)
#                 if transcript:
#                     combined_transcript += f"\nVideo: {video['title']}\n{transcript}\n"
                
#                 # Add delay to avoid rate limiting
#                 time.sleep(0.5)
        
#         return combined_transcript

#     def process_channel(self, channel_name: str, max_videos: int = None) -> str:
#         """Process entire channel and return combined transcript text."""
#         try:
#             channel_id = self.get_channel_id(channel_name)
#             videos = self.get_channel_videos(channel_id, max_videos)
#             return self.save_transcript(channel_name, videos)
#         except Exception as e:
#             raise Exception(f"Error processing channel: {str(e)}")