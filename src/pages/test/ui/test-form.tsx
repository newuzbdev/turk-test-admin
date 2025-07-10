import { Form, Input, Select } from 'antd'

const TestForm = () => {
	return (
		<>
			<Form.Item
				name='title'
				label='Test nomi'
				rules={[{ required: true, message: 'Test nomini kiriting' }]}>
				<Input
					placeholder='Test nomini kiriting'
					size='middle'
				/>
			</Form.Item>

			<Form.Item
				name='type'
				label='Test turi'
				rules={[{ required: true, message: 'Test turini tanlang' }]}>
				<Select
					placeholder='Test turini tanlang'
					size='middle'
					options={[
						{ label: 'Listening', value: 'LISTENING' },
						{ label: 'Reading', value: 'READING' }
					]}
				/>
			</Form.Item>

			<Form.Item
				name='ieltsId'
				label='IELTS ID'
				rules={[{ required: true, message: 'IELTS ID ni kiriting' }]}>
				<Input
					placeholder='IELTS ID ni kiriting'
					size='middle'
				/>
			</Form.Item>
		</>
	)
}

export default TestForm
